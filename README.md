# Motion graphics music video plugin

<img src=".claude-plugin/icon.svg" width="128" height="128" alt="Motion graphics music video icon">

A Claude Code plugin containing a self-contained music video skill and Ruby toolkit extracted from the P(doom) and wife/boyfriend video workflows. It includes Fal image/video/audio adapters, p5 animation, Python analysis/cutouts/audio mixing, Swift Core Image VFX, and RSpec verification.

Install the plugin below, then supply a song and creative prompt. The agent researches, writes the character/scene plan for approval, then generates in reviewed sub-agent waves of 2 → 3–4 → 4–8 → 6–10 repeatedly.

[Skill instructions](.claude/skills/motion-graphics-music-video/SKILL.md) · [Task reference](.claude/skills/motion-graphics-music-video/references/tasks.md) · [Testing](.claude/skills/motion-graphics-music-video/references/testing.md)

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

When enabling the plugin, enter your Fal API key in its **Fal API key** configuration prompt. The required `FAL_AI_API_KEY` option is marked sensitive: Claude Code masks it and stores it in secure credential storage. The plugin passes it through the environment to its bundled Ruby MCP server, which runs Fal tasks without placing the key in prompts or tool arguments. Change it through the plugin's configuration interface and restart/reconnect the server afterward.

For standalone development, set the environment variable in your terminal before running the Ruby toolkit:

```sh
export FAL_AI_API_KEY='your-fal-api-key'
```

This developer setting applies to direct CLI calls or a directly launched `scripts/mcp.rb`; installed plugin users configure the sensitive option. The old `FAL_KEY` variable and home-directory key file are no longer used. Keep actual keys out of chat, source files, and commits. See [credential setup and MCP task usage](.claude/skills/motion-graphics-music-video/references/credentials.md).

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

## External services and data sharing

**Yes: this skill sends data to external services.** The declared `music-video` MCP server runs locally, but its Ruby toolkit makes outbound requests to Fal. Standalone CLI tasks can make the same requests. The skill also uses web research and downloads dependencies as described below.

| Service / destination | Data sent and purpose |
| --- | --- |
| **Fal inference API** (`queue.fal.run`, plus provider-returned status/result URLs) | The Fal API key authenticates API requests. Generation requests include prompts, lyrics when applicable, model settings, and input media URLs; polling includes request identifiers. Fal handles image, video, music, and sound-effect generation, plus audio transcription and stem separation. The bundled model adapters call these models through Fal. |
| **Fal media storage** (`rest.alpha.fal.ai` and provider-returned upload/download URLs, including `*.fal.media`) | Uploads send filenames, content types, and selected file contents: songs or audio segments, stems, reference images, keyframes, and other media required by the chosen task. Generated assets are downloaded and may be uploaded again for subsequent processing. |
| **Fal model schemas** (`fal.ai/api/openapi/queue/openapi.json`) | Schema lookup sends the model endpoint identifier to retrieve its input/output specification. This lookup does not require song contents or creative prompts. |
| **Web research through Claude's available search/browser tools** | Search queries derived from the creative brief, reference URLs, and page requests go to the configured search provider and visited websites. Destinations vary with the research; the plugin does not bundle a separate search service. |
| **Dependency registries during `setup`** | Bundler, npm, and pip contact RubyGems, the npm registry, and PyPI / Python package download hosts (or configured mirrors). They send package/dependency information and ordinary request metadata to install the toolkit's dependencies. These setup steps do not intentionally upload creative media. |

Claude Code also contacts GitHub to install or update this plugin. Normal Claude conversation and tool-result handling still applies when you use the skill.

Fal uploads return media URLs used as model inputs. Treat these as shareable links: anyone with a URL may be able to access its media. The toolkit does not automatically delete remote uploads or generated assets; Fal's handling and retention are governed by its [privacy policy](https://fal.ai/legal/privacy-policy). The production workflow asks for plan and budget approval before new paid generation.

Audio analysis, p5 rendering, FFmpeg editing, ImageMagick processing, and Swift VFX run locally. The bundled code has no maintainer-operated telemetry endpoint. YouTube and Twitter export tasks encode local files; they do not publish videos to those platforms.

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

The plugin's original code and documentation are [MIT licensed](LICENSE). Bundled fonts retain their accompanying SIL Open Font License or Apache 2.0 terms. The [icon generation record](docs/icon-generation.md) documents the Sunburst xhigh image and its resized PNG and SVG versions.
