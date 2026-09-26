# Ruby entry points and task recipes

## Directory layers

```text
motion-graphics-music-video/
  SKILL.md
  references/                    agent instructions
  assets/plan-template.md        planning document template
  scripts/
    mv.rb                        Ruby CLI/bootstrap/project initializer
    Rakefile                     require Ruby task registry; install delegates
    Gemfile + Gemfile.lock        Ruby dependencies, including RSpec
    package.json + lockfile      locked p5/Puppeteer dependencies
    requirements.txt             Python dependencies installed by Ruby setup
    lib/
      tasks.rb                   thin rake declarations
      toolkit/                   task application services and test runner
      workflow/                  plan approval and wave allocation
      pipeline/                  project, steps, manifests, generation/editing
      fal/                       Ruby HTTP queue/storage/model adapters
      media/                     Ruby wrappers that shell out
    tools/
      python/                    analysis, cutouts, tracking and audio mixing
      p5/                        Node renderer, JS animation library, fonts, examples
      vfx/                       Swift package and Core Image effects
    spec/                        high-level RSpec contracts and E2E tests
```

`init` copies the executable toolkit to a new project with the same `Rakefile → lib → tools` layers and adds `config/`, `audio/`, `prompts/`, `docs/`, `output/`. It excludes installed dependencies, build caches, generated outputs and test scratch data. Each project is self-contained; install dependencies there with `setup`. Ruby 3.2+ is required by the OOP code. Run the CLI using the same Ruby used for Bundler.

All examples below are executed from the skill directory. Replace `/absolute/project` with the real initialized project path. `ruby scripts/mv.rb --project /absolute/project 'TASK[...]'` and, inside the project, `bundle exec rake 'TASK[...]'` are equivalent. CLI flags precede/follow the task; task arguments use Rake brackets. Quote bracket expressions in zsh. For file names containing commas, rename/copy the input in Ruby before using Rake's comma-separated arguments.

## Setup and inspection

```sh
ruby scripts/mv.rb --help
ruby scripts/mv.rb -T
ruby scripts/mv.rb --project /absolute/project setup
ruby scripts/mv.rb --project /absolute/project doctor
ruby scripts/mv.rb --project /absolute/project openapi:fetch
ruby scripts/mv.rb --project /absolute/project openapi:summary
```

`setup` calls Bundler, npm ci and Python venv/pip through Ruby. Install system Ruby, Node 22+, Chrome, FFmpeg/ffprobe and ImageMagick beforehand. On macOS install Swift/Xcode command line tools for VFX. `MV_PYTHON` overrides the local `.venv/bin/python3`; `CHROME_PATH` and `MEDIA_FONT` override detected Chrome/font paths. Keep `FAL_KEY` in the environment or `~/.fal_ai_api_key`; never in prompts/config/commits. `doctor` prints JSON booleans; `STRICT=1` makes missing dependencies fail. Tests require the full selected profile's tools and do not silently skip missing dependencies.

## New run configuration

`config/generations.rb` evaluates inside `Pipeline` and returns a Hash. It contains configuration, never rake bodies or shell commands:

```ruby
{
  "char-singer-v1" => { steps: [Steps::RefBase], image_model: Fal::Models::GptImage25 },
  "s01" => {
    steps: [Steps::RefBase, Steps::Music, Steps::Keyframes, Steps::Clips, Steps::Overlay],
    import: { ref_base: "char-singer-v1" },
    **section(0, 240), plate: "paper"
  },
  "s02" => {
    steps: [Steps::RefBase, Steps::Music, Steps::Keyframes, Steps::Clips, Steps::Overlay],
    import: { ref_base: "char-singer-v1" },
    **section(240, 192), plate: "s01/paper"
  }
}
```

For a new identity version edited from a prior character, add a run with `steps: [Steps::RefBase], edit_from: "char-singer-v1"` and write its edit instructions in `01_ref_base.txt`. `edit_from: "s01/approved-edit"` can instead promote an existing edited keyframe. The RefBase service selects the Sunburst edit endpoint, records a new identity and leaves the source untouched. Point dependent runs at the new ID after review.

`section(at, frames)` uses full `audio/song.wav`, offset `at/24.0`, integer frame length and an empty expected-lyrics list. Set `lyrics:` to selected recognizable words if desired. A single H3 plate uses `Video` and a 5–15 second integer duration; multi-shot plates use `Keyframes, Shots, Overlay` with no `plate:`. Sprite scenes use `Clips, Overlay` with a still keyframe `plate:`. `track:` optionally maps names to `[x,y,size,search,from_frame]` for tracked graphics. `reference:` is an optional local reference-video path.

Prompt files per run:

| File | Purpose |
|---|---|
| `01_ref_base.txt` (or `.json`) | Character prompt; JSON is sent as prompt text, not model options |
| `02_keyframes.yml` | Named image edit prompts, `base`, `refs` |
| `04_video.txt` | Single-shot H3 prompt (the Video step reads this stem) |
| `04_shots.yml` | Ordered shots, images, frames, optional audio/retime |
| `04_clips.yml` | H3/still/source sprite specifications and chroma/crop |
| `05_overlay.js` | p5 sketch, rendered through Ruby |

Read each step's `prompt` call if adding a new type. The imported `Music3` wrapper is optional for explicit song-generation requests; the normal skill uses the user's supplied song.

Example `02_keyframes.yml`:

```yaml
paper:
  prompt: "The same approved print palette. Plain warm paper, no people or text."
singer:
  prompt: "SAME approved singer, full body, flat chroma green #00B140, limbs inside frame, no text."
reaction:
  base: singer
  prompt: "Same singer and framing; change only the expression to surprised."
duet:
  refs: [char-guest-v1]
  prompt: "Singer from image 1 and guest from image 2, separated silhouettes."
```

`base: false` omits the current ref_base; combine with `refs`. `base: other-run/keyframe` reuses an edited frame. An earlier same-run keyframe must appear before any dependent edit.

Example `04_clips.yml`:

```yaml
- name: sing
  image: singer
  seconds: 5
  audio: audio/stems/vocals.wav
  audio_at: 0
  gate: -36
  key: green
  prompt: "Same singer and print style. Articulate the approved opening lyric; eyebrow raise on its joke. Locked camera, flat green, no text."
- name: surprise
  still: reaction
  key: green
```

`audio_at` is section-local, not the whole-song time. Omit `gate` if it damages consonants. `box: [x,y,w,h]`, `seed: [x,y]`, `frames`, `start`, `scale` are cutout options. Use the approved full prompt directive, style and performance details in real files; these abbreviated examples only show the schema.

## Production and review commands

```sh
NOTE='User approved the linked plan and its generation allowance' ruby scripts/mv.rb --project /absolute/project plan:approve
ruby scripts/mv.rb --project /absolute/project work:next
JOB=singer-v1 EVIDENCE=docs/reviews/singer-v1.md ruby scripts/mv.rb --project /absolute/project work:accept
RUN=char-singer-v1 ruby scripts/mv.rb --project /absolute/project gen:ref_base
RUN=char-singer-v1 ruby scripts/mv.rb --project /absolute/project review:ref_base
RUN=s01 ruby scripts/mv.rb --project /absolute/project pipeline:all
RUN=s01 ONLY=sing FORCE=1 ruby scripts/mv.rb --project /absolute/project gen:clips
RUN=s01 RECUT=1 ONLY=sing FORCE=1 ruby scripts/mv.rb --project /absolute/project gen:clips
RUN=s01 ruby scripts/mv.rb --project /absolute/project 'anim:preview[0,24,96,239]'
RUN=s01 ruby scripts/mv.rb --project /absolute/project anim:overlay
ruby scripts/mv.rb --project /absolute/project 'media:preview[output/clean.mp4,s01,s02]'
```

`gen:ref_base`, `gen:keyframes`, `gen:video`, `gen:shots`, H3 `gen:clips`, generated music, `gen:overlay`, `review:music`, stems and SFX may call paid Fal endpoints. `gen:music` for an imported song is local processing plus CDN upload; `gen:overlay` uses paid Whisper unless re-rendering saved cues through `anim:overlay`. Reviews other than music are local. `pipeline:all` includes paid review calls; allocate them in the plan.

`FORCE=1` changes cached work; `ONLY` confines ItemsStep work to named assets. A selected partial item set will not build the complete step's board until all items exist. `NEW_REQUEST=1` allows a new identical paid request; normal retries reuse saved receipts. `history[step]`, `adopt[step,request_id]`, `pick[step,index]`, `import[step,source_run]` support recovery and reuse. ItemsStep recovery uses per-item stored request IDs and reruns; adopt/pick are for single-output steps.

## Analysis, finishing and utility tasks

```sh
ruby scripts/mv.rb --project /absolute/project 'audio:analyze[audio/source.mp3,audio]'
ruby scripts/mv.rb --project /absolute/project 'audio:transcribe[audio/song.wav,audio/words.json]'
ruby scripts/mv.rb --project /absolute/project 'media:stems[audio/song.wav,audio/stems,vocals]'
ruby scripts/mv.rb --project /absolute/project 'media:frames[reference.mp4,output/reference_frames,12,480]'
ruby scripts/mv.rb --project /absolute/project 'media:cuts[reference.mp4,output/cuts.json]'
ruby scripts/mv.rb --project /absolute/project 'media:mouth[output/s01/04_clips/sing,audio/stems/vocals.wav,0,120,60,40,20]'
ruby scripts/mv.rb --project /absolute/project 'anim:render[tools/p5/examples/smoke.js,tmp/smoke,48,1920,1080]'
SFX=finish-sfx ruby scripts/mv.rb --project /absolute/project sfx:gen
SFX=finish-sfx ruby scripts/mv.rb --project /absolute/project sfx:mix
VFX=finish-vfx ruby scripts/mv.rb --project /absolute/project vfx:analyze
VFX=finish-vfx ruby scripts/mv.rb --project /absolute/project 'vfx:stills[0,24,120]'
VFX=finish-vfx ruby scripts/mv.rb --project /absolute/project 'vfx:clip[96,144]'
VFX=finish-vfx ruby scripts/mv.rb --project /absolute/project vfx:render
ruby scripts/mv.rb --project /absolute/project 'media:twitter[output/finished.mp4,output/delivery-1080.mp4]'
```

`media:probe`, `media:sheet`, `media:frame`, `media:cut`, `media:cutout`, `media:sprite_box`, `media:style`, `media:concat`, `media:mux`, `media:upload` and `media:youtube` are listed by `-T` with their arguments. Export names denote encoding presets; they do not publish to platforms. For unlisted operations, add an OOP service under `lib/` and a thin registry delegate. Keep backend code under `tools/` and tests in `spec/`.

The packaging follows [Agent Skills script guidance](https://agentskills.io/skill-creation/using-scripts): relative entry paths, explicit prerequisites, noninteractive arguments, help, meaningful failure codes and compact results. Ruby OOP methods own execution and delegate backend work.
