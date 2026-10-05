# Cast, asset recipes and project continuity

The portable pack is `assets/lesson/`, copied into each initialized project at `.skill/assets/lesson/`. It contains readable prompts and JSON provenance, without PNG artwork, MP3 music, video clips or font binaries. `manifest.json` records shipped text files under `files`; `regenerate_when_needed` records omitted media and their recipe paths relative to `assets/lesson/`. Historical hashes and byte counts identify the old outputs, not requirements for replacements. No original `video-session14` directory is needed.

## Default identities and voices

| Role | Project-local output target | Prompt | Eleven v4 voice / stability / seed |
|---|---|---|---|
| Prof. Otto Regress | `characters/char-prof-v1.png` | [Professor prompt](../assets/lesson/prompts/char-prof-v1.txt) | George / 0.45 / 11 |
| Developer (makevoid in the source lesson) | `characters/char-dev-v1.png` | [Developer prompt](../assets/lesson/prompts/char-dev-v1.txt) | Liam / 0.5 / 41 |

These image paths are targets under the project's `.skill/assets/lesson/`, not existing files on initialization. Defaults apply only when those roles are needed; remove unused roles from cast, script, generation graph, parade and credits. The developer prompt's early “Luca” name is a legacy identifier, not a different character. Keep the professor's right-hand pointer/left-hand chalk and developer's right-arm laptop, pocket can, adult proportions and flat-tone stubble.

For a new selected identity, copy its prompt into `prompts/char-<id>-v1/01_ref_base.txt`, define the corresponding identity run with `steps: [Steps::RefBase]`, and generate through `gen:ref_base` after production authorization. See [task/configuration examples](tasks.md) and [identity prompts](prompts.md#identity-sheets-gpt-image-25-sunburst-xhigh). Inspect the sheet before accepting it. Save the accepted image at the target above or update `config/cast.json` to its real output path; `reference_prompt` identifies the source prompt. Never recreate an accepted identity from prose for each scene.

If the user supplies an existing approved sheet, register it without an image-generation call:

```json
{"project":"/absolute/lesson","task":"ref:register[char-prof-v1,.skill/assets/lesson/characters/char-prof-v1.png]","options":{}}
```

That command requires the local file to exist. It uploads exact bytes, records provenance, is idempotent for the same identity, and rejects replacing a different identity in that RUN. A freshly generated `gen:ref_base` run already has reference metadata; it does not need a second registration. Import its `ref_base` into scenes or use `refs: ["char-prof-v1"]` for keyframes. Use each selected approved sheet for one clean pose on green, then animate that pose. Additional or replacement characters follow the user's brief.

## Assets to regenerate

Generate only assets selected in the lesson plan, through the existing MCP workflow after production authorization. Include image, clip and music costs in that plan. Initialization copies text and SVGs only; installation and setup do not fetch or recreate omitted media. Store outputs in the lesson project, never in the installed/distributed plugin. Reuse approved project assets before generating another take.

| Output targets relative to project `.skill/assets/lesson/` | Readable source and preparation |
|---|---|
| `characters/char-prof-v1.png`, `characters/char-dev-v1.png` | The character prompts above; generate and review only the selected cast. |
| `plates/classroom.png`, `plates/developer-room.png`, `plates/agent-lab.png` | [Still background prompts](../assets/lesson/prompts/plates.md). Keep teaching areas clear, then measure new board and staging bounds. |
| `props/<group>/<name>.png`, including each `board.png` contact sheet | [Prop prompts](../assets/lesson/prompts/props.md). Generate isolated transparent sprites; assemble a contact sheet locally only if useful. Original `index.json` crop boxes are historical, so measure new boxes, pivots and gear teeth. |
| `curtain/closed.png`, `curtain/open.png`, `curtain/close.mp4`, `curtain/open.mp4` | [Curtain prompts](../assets/lesson/prompts/curtain.md). Generate closed first, edit it to open, then animate matching silent close/open clips. |
| `loops/face_prof.mp4` | From the approved professor sheet, make one close-up pose on green; animate a silent blink, eyebrow lift and small head reaction with a closed mouth. |
| `loops/face_luca.mp4` | From the approved developer sheet, make one close-up pose on green; animate a silent blink and subtle amused or drowsy reaction returning to the starting pose. |
| `loops/run_luca.mp4` | From the developer sheet, make a full-body side-facing pose on green, then a silent run cycle in place. Keep the silhouette in frame and the camera locked; p5 supplies travel. |
| `music/{intro,class,blackboard,devroom,titles}.mp3` (historical targets) | Original prompts and durations are in `music/<name>.json` and the starter `prompts/finish-music/music.yml`. `music:gen` saves new tracks under `output/finish-music/tracks/`; the mixer uses them directly, so no copy into `.skill` is required. See [music generation and local reuse](narration-and-music.md#background-beds). |

The ending directory also omits its PNG guides and archived reference frames. Use [ending regeneration recipes](../assets/templates/ending/regeneration.md) to export matching SVGs locally or capture frames of the new ending. These are optional references, not required downloads.

For H3 animations, supply actual reviewed project images in the request, normally for a five-second silent clip. Inspect identity, curtain continuity, keying edges and loop seams. Measure new clip landmarks before adapting the [ending motion recipes](ending-motion.md); archived timings describe the omitted originals. Save fresh generation metadata and credit new outputs as newly generated. Historical hashes do not promise byte-identical regeneration.

## Use accepted project assets

After the classroom exists, set `plate_file: ".skill/assets/lesson/plates/classroom.png"` to reuse it without another keyframe or upload. In p5 load `/.skill/assets/lesson/plates/classroom.png` inside your camera. If the accepted image stays under `output/`, use that actual path instead. Character-free scenes omit RefBase, Keyframes and Clips.

After generating selected curtain videos, process them as local sources in a scene's `04_clips.yml`:

```yaml
- name: curtain_close
  source: .skill/assets/lesson/curtain/close.mp4
  key: green
- name: curtain_open
  source: .skill/assets/lesson/curtain/open.mp4
  key: green
```

`gen:clips` creates normal `Anim.clip` metadata and PNG sequences. Reuse approved identities and local silent loops, while generating spoken acting against the new narration stems.

## Style and typography

Premium 2D cartoon, about 2.5 heads tall, head around 40%, dark plum-black ink `#1B1A22`, flat cel fills with one soft shadow and warm rim light, matte surfaces. Chalkboard `#1E3B34`, chalk `#F3EFE4`, paper `#F6EEDC`, amber `#FFB53D`. No generated lettering. Character green/teal must not collide with the chroma key. Preserve this style unless the user requests another.

Fonts are not bundled; they are selected from the machine's installed fonts before rendering (see [project fonts](animation-audio-vfx.md#project-fonts)). The project filenames, their roles and the stock macOS defaults in `fonts/default-selection.json`:

| Files | Purpose |
|---|---|
| `chalk.ttf` (Chalkduster) | board headings/write-on |
| `mono.ttf`, `mono-andale.ttf` (SF Mono, Andale Mono) | code, terminal, precise punctuation |
| `din-cond.ttf`, `din-alt.ttf` | titles, small credit role headings |
| `body.ttf`, `body-med.ttf`, `body-black.ttf` (Arial, Arial Bold, Arial Black; the original lesson used Roboto) | captions, body, emphasis |
| `math.otf`, `math-it.otf` (STIX) | equations |
| `hand.ttf` (Bradley Hand) | handwritten jokes and asides |

Any installed TTF/OTF can replace a default. Swap one when it is missing, unsuitable for the art direction, lacks the needed glyphs, or has a licence that does not fit your distribution. Load exact names via `Anim.fonts`, then preview punctuation and the required language glyphs. Credit the faces you actually used.
