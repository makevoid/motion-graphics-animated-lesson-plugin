# Fal credentials and plugin execution

The plugin declares an optional sensitive `FAL_AI_API_KEY` option. Claude Code collects and stores it in secure credential storage, then injects it into the `music-video` MCP server's environment as `FAL_AI_API_KEY_PLUGIN`. When that value is empty the server uses `FAL_AI_API_KEY` from the environment Claude Code was launched in. The option is optional so the server starts, and `credential_status` can report a missing key, instead of Claude Code dropping the server. The model does not receive the value. Configure it through the plugin's configuration interface, never through chat or a command argument. Restart/reconnect the MCP server after changing the key.

The server is `scripts/mcp.rb`, a Ruby stdio process using standard libraries. It starts before project dependencies are installed. Its tools delegate to `scripts/mv.rb`; Ruby remains the execution layer. No key is read from the user's home directory or written to project files. Only initialize and execute projects the user trusts: the toolkit intentionally loads the project's Ruby configuration and Rakefile.

## Plugin workflow

1. Use the Ruby CLI to initialize a separate video project and run `setup`. File editing, local analysis, plan writing, and `plan:approve` stay in the CLI/native tools.
2. Use `credential_status` on the `music-video` server. It returns only `configured: true/false`. If false, ask the user to configure the plugin (`/plugin configure motion-graphics-music-video`) or relaunch Claude Code with `FAL_AI_API_KEY` exported, then reconnect the server; do not ask for the secret itself.
3. Run `doctor` through `run_task` for a complete dependency/credential check. Direct Bash calls do not inherit the plugin's sensitive option.
4. After the user approves the plan and the CLI records that approval, run Fal-facing tasks through `run_task`. Translate Rake recipes into `project`, `task`, and string `options` fields:

```json
{
  "project": "/absolute/video-project",
  "task": "gen:ref_base",
  "options": {"RUN": "char-singer-v1"}
}
```

For `audio:transcribe`, use a task such as `audio:transcribe[audio/song.wav,audio/words.json]`. Comma-separated task arguments follow the same Rake rules as the CLI. The tool supports `doctor`, `audio:transcribe`, `media:stems`, `media:upload`, `sfx:gen`, `pipeline:all`, `adopt`, all `gen:*` tasks, and `review:music`. Run other local recipes directly through the Ruby CLI.

5. `run_task` immediately returns `job_id`. Poll `task_status` with `{"job_id":"returned-id"}` until `completed` or `failed`. Check `exit_code`, recent redacted output, and the generated artifacts. Continue the worker journal and wave reviews normally. Up to ten jobs can run concurrently, each with its own task options and subprocess.

The server checks the project's plan approval before starting any supported task except `doctor`, including media uploads. It accepts only the documented task names and options; it does not expose an arbitrary shell tool or accept a key as a tool argument. The credential is passed only through the child process environment. Exact key values are redacted from output returned by the server.

`cancel_task` stops the local worker. An already submitted Fal request can still finish and incur charges. Server shutdown also stops local workers. In-memory job IDs do not survive a restart; use the project's saved queue receipts to resume the original task, and avoid `NEW_REQUEST=1` unless a new paid request is intended.

## Standalone and developer use

For direct Ruby CLI calls, set `FAL_AI_API_KEY` in the launching terminal or inject it from your development secret manager:

```sh
export FAL_AI_API_KEY='your-fal-api-key'
ruby .claude/skills/motion-graphics-music-video/scripts/mv.rb --project /absolute/video-project doctor
```

The same variable works when launching `scripts/mcp.rb` directly in a developer MCP configuration. The installed plugin's server also falls back to it when the plugin option is unset; a configured option takes precedence. `FAL_KEY` and the old home-directory key file are no longer supported. Keep real keys out of prompts, source files, command arguments, and commits.
