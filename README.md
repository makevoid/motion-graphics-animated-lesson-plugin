# Motion graphics music video skill

A self-contained Claude skill and Ruby toolkit extracted from the P(doom) and wife/boyfriend video workflows. It includes Fal image/video/audio adapters, p5 animation, Python analysis/cutouts/audio mixing, Swift Core Image VFX, and RSpec verification.

Invoke `/motion-graphics-music-video` in Claude Code with this repository open. Supply a song and creative prompt when asked. The agent researches, writes the character/scene plan for approval, then generates in reviewed sub-agent waves of 2 → 3–4 → 4–8 → 6–10 repeatedly.

[Skill instructions](.claude/skills/motion-graphics-music-video/SKILL.md) · [Task reference](.claude/skills/motion-graphics-music-video/references/tasks.md) · [Testing](.claude/skills/motion-graphics-music-video/references/testing.md)

From the repository root:

```sh
ruby .claude/skills/motion-graphics-music-video/scripts/mv.rb --help
ruby .claude/skills/motion-graphics-music-video/scripts/mv.rb setup
ruby .claude/skills/motion-graphics-music-video/scripts/mv.rb test
```

`rake test` is also a thin delegate to the Ruby entry point. All normal tests are local and make no paid Fal calls. Live tests require explicit paid-test opt-in; see the testing guide. The local full suite requires macOS for Swift VFX, Chrome, FFmpeg, ImageMagick, Node, Python and Ruby. No original project outputs, songs, secrets or generated characters are bundled. Fonts retain their license files.
