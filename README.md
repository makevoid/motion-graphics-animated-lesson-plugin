# Motion Graphics Animated Lesson

Version **0.2.0**.

A Claude Code plugin for creating narrated cartoon lessons from a topic, paper, repository or script. It combines character acting with p5 diagrams, code, captions and camera moves, then adds music ducked under dialogue, a theatrical curtain call and animated credits.

The plugin includes its reusable artwork, curtain images/animations, animation and timing recipes and all five original music beds. 


NOTE: The project is in beta and this readme still needs to be rewritten by a human (e.g. me :)) - In the meantime you could download it, fire Claude Code in a local directory containing this repo and ask Claude to set it up including all dependencies. You should be up and running in little time.

I will try to complete the readme for manual setup soon.

Enjoy

See 10 examples on X: (1-9) https://x.com/makevoid/status/2105673599046598834

10: https://x.com/makevoid/status/2105311203715153972?s=46

## Install and invoke

From a local checkout in Claude Code:

```sh
claude --plugin-dir /absolute/path/to/motion-graphics-animated-lesson-plugin
```

Invoke `/motion-graphics-animated-lesson:motion-graphics-animated-lesson`, or ask for a cartoon animated lesson. Configure `FAL_AI_API_KEY` through the plugin configuration UI for generation; the `animated-lesson` MCP server holds the key. Local reuse/rendering does not need a generation call. Developer CLI usage can receive the key from the environment.

Example brief:

> Make a three-minute lesson explaining database indexes. Use the professor and developer, show a worked example, reuse the classroom and original intro/ending music, and end with a callback joke and curtain-call credits.

A new lesson begins without a song:

```sh
ruby .claude/skills/motion-graphics-animated-lesson/scripts/mv.rb init \
  --project /absolute/new-lesson --prompt-file /absolute/brief.md
ruby .claude/skills/motion-graphics-animated-lesson/scripts/mv.rb --project /absolute/new-lesson setup
```

Then research/script/plan, record existing production authorization, generate the dialogue through MCP, build narration and measured scene timing, produce/review scenes, assemble, mix and deliver. Optional `--song` imports an existing narration master. `audio/song.wav` and `gen:music` retain their historical names but represent narration and its section cuts; background beds use `music:bed`.


---

Here follows a draft readme that will be updated soon for human consumption:

## DRAFT Readme 

### Characters

The default lecturer is Professor. Otto, voiced by **George** voice on ElevenLabs Eleven v4. The default character is a young male developer ( the voice uses **Liam** ). Their original identity sheets and voice settings are preserved. These are the only bundled characters. Either role  **can be** omitted or  **replaced by the prompt**. 

## Preserved templates and media

- [Skill workflow](.claude/skills/motion-graphics-animated-lesson/SKILL.md)
- [Cast, classroom, props, font roles and silent loops](.claude/skills/motion-graphics-animated-lesson/references/cast-and-assets.md)
- [Ending text template, PNG/SVG layouts and original frames](.claude/skills/motion-graphics-animated-lesson/assets/templates/ending/TEMPLATE.md)
- [Narration, Eleven v4 and ducked music recipes](.claude/skills/motion-graphics-animated-lesson/references/narration-and-music.md)
- [Asset provenance and exact hashes](.claude/skills/motion-graphics-animated-lesson/assets/lesson/manifest.json)
- [Lesson plan template](.claude/skills/motion-graphics-animated-lesson/assets/plan-template.md)

All five original music beds (intro, class, blackboard, devroom and titles) are bundled as 192 kbps CBR MP3s. Use MP3 for any new bundled audio. Initialized projects default to those local files, with the intro and titles intended for the opening and ending. Set measured segment ranges and run `music:bed` locally. The source tracks stay unchanged; looping, fades and narration ducking happen in the mix.

Ending templates preserve 1920×1080/24fps layout, curtain folds/open/closed states, takeaway/source card, title card, alternating character/voice credits, two-column production credits and final joke. Future lessons reuse the layout and image references while supplying their own facts, cast and actual production credits.

## Runtime and verification

Ruby 3.2+, Bundler, FFmpeg/ffprobe, ImageMagick, Python 3, Node.js 22+ and Chrome. Ruby invokes all media backends. Optional Swift effects require macOS 14+ and Swift 5.9+. Fal adapters include ElevenLabs Eleven v4 TTS, ElevenLabs Music v2.5, GPT Image 2.5 Sunburst and MiniMax H3 Max; fetch current schemas before generation.

```sh
rake test
# or PROFILE=core / media / swift
PROFILE=core rake test
```

Routine tests use local media and mocked network calls. Paid live tests are opt-in. See [verification guidance](.claude/skills/motion-graphics-animated-lesson/references/testing.md).

### Minor notes


Fonts are not bundled: each project selects TTF/OTF fonts installed on your machine (see [project fonts](.claude/skills/motion-graphics-animated-lesson/references/animation-audio-vfx.md#project-fonts)). New projects are self-contained; the original directory is not required.


### License

The toolkit code is MIT licensed. Preserved user-supplied artwork and model outputs retain their original provenance and applicable terms. System fonts selected into a project keep their own licenses.

---

Feel free to contribute to this repo and enjoy using this plugin!
