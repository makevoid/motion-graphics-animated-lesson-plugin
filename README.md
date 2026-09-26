# Motion graphics music video plugin

<a href=".claude-plugin/icon.png"><img src=".claude-plugin/icon.png" width="128" height="128" alt="Orange glass chat bubble with a timeline play button and music note"></a>

A Claude Code plugin containing a self-contained music video skill and Ruby toolkit extracted from the P(doom) and wife/boyfriend video workflows. It includes Fal image/video/audio adapters, p5 animation, Python analysis/cutouts/audio mixing, Swift Core Image VFX, and RSpec verification.

Example made with this skill: [“You knew how to fork” (@joshcirre)](https://youtu.be/b70F1bWZlwE)

<a href="https://youtu.be/b70F1bWZlwE"><img src="https://i.ytimg.com/vi/b70F1bWZlwE/hqdefault.jpg" width="480" alt="Thumbnail of the “You knew how to fork” music video made with this skill"></a>

Follow the quick start below, then supply a song and creative prompt. The agent researches, writes the character/scene plan for approval, then generates in reviewed sub-agent waves of 2 → 3–4 → 4–8 → 6–10 repeatedly.

[Skill instructions](.claude/skills/motion-graphics-music-video/SKILL.md) · [Task reference](.claude/skills/motion-graphics-music-video/references/tasks.md) · [Testing](.claude/skills/motion-graphics-music-video/references/testing.md)

## Quick start

1. Install the plugin from your terminal:

   ```sh
   claude plugin marketplace add makevoid/motion-graphics-music-video-skill
   claude plugin install motion-graphics-music-video@makevoid-music-video --scope user
   ```

2. Start `claude` in the terminal and set your Fal API key:

   ```text
   /plugin configure motion-graphics-music-video
   ```

   Enter your Fal AI key in the **Fal API key** field.

3. Open Claude Desktop, select **Code**, and start a new code session with access to a folder.

4. Run the skill, then supply your song and creative prompt:

   ```text
   /motion-graphics-music-video:motion-graphics-music-video
   ```

That's it. The plugin's `music-video` MCP server runs every Fal AI task with your key. Claude Code keeps the key in secure credential storage and passes it only to that server, so the Claude session never sees it.

## Installation

### Install the plugin (recommended)

With Git and Claude Code installed, run these commands in your terminal:

```sh
claude plugin marketplace add makevoid/motion-graphics-music-video-skill
claude plugin install motion-graphics-music-video@makevoid-music-video --scope user
```

The user-scoped installation makes the plugin available across your projects. Claude Code downloads it from GitHub; you do not need a separate clone or symlink. See [Claude Code plugin installation](https://code.claude.com/docs/en/plugins/install) for other installation scopes.

### Prerequisites and first run

Before generating a video, install Ruby 3.2+ with Bundler, Node.js 22+, Python 3, Chrome, FFmpeg (including ffprobe), and ImageMagick. Swift VFX and the full test suite require macOS 14+ with Swift 5.9+ / Xcode command line tools.

Enter your Fal API key in the plugin's **Fal API key** option, via its configuration prompt or `/plugin configure motion-graphics-music-video`. The `FAL_AI_API_KEY` option is marked sensitive: Claude Code masks it and stores it in secure credential storage. The plugin passes it through the environment to its bundled Ruby MCP server, which runs Fal tasks without placing the key in prompts or tool arguments. The option is optional so the `music-video` server always starts: when it is unset, the server falls back to a `FAL_AI_API_KEY` exported in the environment that launched Claude Code, and `credential_status` reports `configured: false` if neither is present. Change it through the plugin's configuration interface and restart/reconnect the server afterward.

For standalone development, set the environment variable in your terminal before running the Ruby toolkit:

```sh
export FAL_AI_API_KEY='your-fal-api-key'
```

This setting applies to direct CLI calls, a directly launched `scripts/mcp.rb`, and the installed plugin's server when its option is unset; a configured plugin option takes precedence. The old `FAL_KEY` variable and home-directory key file are no longer used. Keep actual keys out of chat, source files, and commits. See [credential setup and MCP task usage](.claude/skills/motion-graphics-music-video/references/credentials.md).

Start a new Claude Code session in the directory where you want to work:

```sh
claude
```

Inside Claude Code, invoke:

```text
/motion-graphics-music-video:motion-graphics-music-video
```

Supply a song attachment or local path and a creative prompt. The skill creates a separate video project, runs `setup` to install Ruby gems, npm packages, and a local Python environment there, then runs `doctor` to check dependencies. It asks you to approve its plan and budget before new paid generation. Dependencies and production files stay in the video project, outside the plugin installation.

`doctor` reports dependency checks as JSON booleans. Plugin sessions run it through the MCP server to include the configured key; a direct Bash invocation cannot see the plugin's sensitive option. See the [task reference](.claude/skills/motion-graphics-music-video/references/tasks.md) for environment overrides and setup details. `${CLAUDE_SKILL_DIR}` in the instructions is replaced by Claude Code with the installed skill's path; you do not need to export it in your shell.

### Update the plugin

```sh
claude plugin marketplace update makevoid-music-video
claude plugin update motion-graphics-music-video@makevoid-music-video --scope user
```

Restart Claude Code after updating. Existing video projects retain their copied toolkit; updating the plugin affects future project initialization.

## Local development and manual installation

To work on the plugin locally, clone the repository and validate both manifests:

```sh
git clone https://github.com/makevoid/motion-graphics-music-video-skill.git
cd motion-graphics-music-video-skill
claude plugin validate .claude-plugin/plugin.json --strict
claude plugin validate .claude-plugin/marketplace.json --strict
```

Load your local plugin for a session with `claude --plugin-dir /absolute/path/to/motion-graphics-music-video-skill` and use the same namespaced command shown above.

The repository also supports standalone skill use: start `claude` in the clone and invoke `/motion-graphics-music-video`. For standalone use across projects on macOS or Linux, run this from the clone's root:

```sh
mkdir -p ~/.claude/skills
ln -s "$PWD/.claude/skills/motion-graphics-music-video" \
  ~/.claude/skills/motion-graphics-music-video
```

Keep the clone in place because the link points to it. If the destination exists, inspect it before replacing it. Keep the whole skill folder, including its scripts, references, and assets. Update a manual clone with `git pull --ff-only`.

### Publishing plugin updates

The [marketplace catalog](.claude-plugin/marketplace.json) lists this repository's root as the plugin source. The [plugin manifest](.claude-plugin/plugin.json) points to the existing `.claude/skills/` folder. Increment `version` in `plugin.json` for each release, validate both manifests, and commit and push the release files to GitHub. The GitHub installation commands require these manifests to be present on the repository's default branch.

## Videos created with this skill

- [You knew how to fork - @joshcirre](https://youtu.be/Nxhg23_fheY) — A developer-culture satire, with the song credited to @joshcirre with Suno in the video description.
- [Upping my P(doom) - Video Remix #2 - Opus 5.5 (et al.)](https://youtu.be/s8PmK6zD5RY) — A remix of donaldjewkes's video remix. The description credits Claude Opus 5.5, GPT Image 2.5 Sunburst, and Minmax H3.
- [You knew how to fork - @joshcirre - variant #2 - just intro](https://youtu.be/CNKgmle-j1k) — An intro-only second variant of the @joshcirre video.

## Example run

Invoking the skill in Claude Code produces output like this:

```text
─────────────────────────────────────────────────────────────────────────────────
❯ /motion-graphics-music-video:motion-graphics-music-video
─────────────────────────────────────────────────────────────────────────────────

⏺ Skill(motion-graphics-music-video:motion-graphics-music-video)
Successfully loaded skill

The motion-graphics-music-video skill is loaded. To start, I need two things:

1. The song: an attachment or a local path (mp3/wav/m4a).
2. A creative prompt: the concept, vibe, story or characters you want.

These are optional, and I'll use defaults for anything you leave out:
- Reference videos or images.
- Characters you want to keep. For example, the dreadlocks singer (char-singer-dreads) from the main repo.
- Aspect ratio. The default is 16:9 at 24fps, delivered at 1080p.
- Who the video is for.
- Budget. This sets the limit on paid fal calls and retries.

Once I have the song and prompt, I'll set up a separate project for it and analyze the song's beats and energy. I'll also research visual ideas online and write docs/PLAN.md with the character prompts, scene prompts and a cost estimate. I won't make any paid generation calls until you approve that plan.
```

## Toolkit commands

From the repository root:

```sh
ruby .claude/skills/motion-graphics-music-video/scripts/mv.rb --help
ruby .claude/skills/motion-graphics-music-video/scripts/mv.rb setup
ruby .claude/skills/motion-graphics-music-video/scripts/mv.rb test
```

`rake test` is also a thin delegate to the Ruby entry point. All normal tests are local and make no paid Fal calls. Live tests require explicit paid-test opt-in; see the testing guide. The local full suite requires macOS for Swift VFX, Chrome, FFmpeg, ImageMagick, Node, Python and Ruby. No original project outputs, songs, secrets or generated characters are bundled. Fonts retain their license files.

## License

The plugin's original code and documentation are [MIT licensed](LICENSE). Bundled fonts retain their accompanying SIL Open Font License or Apache 2.0 terms. The [icon generation record](docs/icon-generation.md) documents the Nano Banana 2 high-thinking image and its resized PNG and SVG versions.

## External services and data sharing

The local MCP server and standalone CLI send data to external services:

- **Fal API and storage** (`queue.fal.run`, `rest.alpha.fal.ai`, provider-returned URLs including `*.fal.media`): API authentication, prompts, lyrics, settings, and selected audio/images/video for generation, transcription, and stem separation. Media URLs may be accessible to anyone with the link; remote assets are not automatically deleted. See [Fal's privacy policy](https://fal.ai/legal/privacy-policy).
- **Fal schemas** (`fal.ai/api/openapi/queue/openapi.json`): model identifiers for schema lookup.
- **Web research**: creative-brief search queries and reference URLs go to Claude's configured search provider and visited sites.
- **Dependencies and updates**: setup contacts RubyGems, npm, and PyPI (or configured mirrors) with package information; plugin installation and updates contact GitHub.
- **Local processing**: analysis, rendering, editing, and exports run locally. No maintainer telemetry or automatic social publishing is included. Normal Claude conversation and tool-result handling still applies.
