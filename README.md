# Motion graphics music video skill

A self-contained Claude skill and Ruby toolkit extracted from the P(doom) and wife/boyfriend video workflows. It includes Fal image/video/audio adapters, p5 animation, Python analysis/cutouts/audio mixing, Swift Core Image VFX, and RSpec verification.

Invoke `/motion-graphics-music-video` in Claude Code with this repository open. Supply a song and creative prompt when asked. The agent researches, writes the character/scene plan for approval, then generates in reviewed sub-agent waves of 2 → 3–4 → 4–8 → 6–10 repeatedly.

[Skill instructions](.claude/skills/motion-graphics-music-video/SKILL.md) · [Task reference](.claude/skills/motion-graphics-music-video/references/tasks.md) · [Testing](.claude/skills/motion-graphics-music-video/references/testing.md)

## Installation

### Use in this repository

With Git and Claude Code installed, clone the repository:

```sh
git clone https://github.com/makevoid/motion-graphics-music-video-skill.git
cd motion-graphics-music-video-skill
```

Claude Code discovers the skill in `.claude/skills/motion-graphics-music-video/` automatically when started here. Keep the entire skill folder: it includes the scripts, references, and assets needed to make videos.

### Set up the video toolkit

Before running setup, install Ruby 3.2+ with Bundler, Node.js 22+, Python 3, Chrome, FFmpeg (including ffprobe), and ImageMagick. Swift VFX and the full test suite require macOS 14+ with Swift 5.9+ / Xcode command line tools.

From the repository root, install the Ruby gems, npm packages, and local Python environment:

```sh
ruby .claude/skills/motion-graphics-music-video/scripts/mv.rb setup
```

For paid generation, provide your Fal API key through the `FAL_KEY` environment variable before starting Claude Code, or save it in `~/.fal_ai_api_key`. Keep the key out of prompts, project configuration, and Git commits.

Check the environment, then start Claude Code:

```sh
ruby .claude/skills/motion-graphics-music-video/scripts/mv.rb doctor
claude
```

`doctor` reports dependency checks as JSON booleans. Resolve missing dependencies needed for your workflow; use `STRICT=1` before the command to make missing checks fail. See the [task reference](.claude/skills/motion-graphics-music-video/references/tasks.md) for environment overrides and setup details.

Inside Claude Code, invoke:

```text
/motion-graphics-music-video
```

Supply a song attachment or local path and a creative prompt. The skill creates a separate video project and asks you to approve its plan and budget before new paid generation.

### Optional: make the skill available in every project

On macOS or Linux, run these commands from the cloned repository root:

```sh
mkdir -p ~/.claude/skills
ln -s "$PWD/.claude/skills/motion-graphics-music-video" \
  ~/.claude/skills/motion-graphics-music-video
```

You can then start Claude Code in another project and invoke `/motion-graphics-music-video`. Keep the clone in its current location because the link points to it. If the destination already exists, inspect your existing installation before replacing it. Claude Code supports both [project and personal skills, including symlinked folders](https://code.claude.com/docs/en/skills#choose-where-skills-load).

### Update

From the cloned repository root:

```sh
git pull --ff-only
ruby .claude/skills/motion-graphics-music-video/scripts/mv.rb setup
```

The optional personal-skill link uses the updated files automatically.

## Videos created with this skill

- [You knew how to fork - @joshcirre](https://youtu.be/Nxhg23_fheY) — A developer-culture satire, with the song credited to @joshcirre with Suno in the video description.
- [Upping my P(doom) - Video Remix #2 - Opus 5.5 (et al.)](https://youtu.be/s8PmK6zD5RY) — A remix of donaldjewkes's video remix. The description credits Claude Opus 5.5, GPT Image 2.5 Sunburst, and Minmax H3.
- [You knew how to fork - @joshcirre - variant #2 - just intro](https://youtu.be/CNKgmle-j1k) — An intro-only second variant of the @joshcirre video.

## Example run

Invoking the skill in Claude Code produces output like this:

```text
─────────────────────────────────────────────────────────────────────────────────
❯ /motion-graphics-music-video
─────────────────────────────────────────────────────────────────────────────────

⏺ Skill(motion-graphics-music-video)
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
