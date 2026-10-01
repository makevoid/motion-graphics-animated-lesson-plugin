# Preserved cast, classroom and fonts

The portable pack is `assets/lesson/`, copied into each initialized project at `.skill/assets/lesson/`. `manifest.json` records bundled files under `files`, with original relative paths, byte counts and SHA-256 values. Its `regenerate_when_needed` entries describe omitted originals for provenance only; their hashes and byte counts are not requirements for newly generated replacements. These files are preserved from `video-session14/aicodegen`; no absolute path to that project is required at runtime.

## Default identities

| Role | Sheet | Voice / stability / seed |
|---|---|---|
| Prof. Otto Regress | `characters/char-prof-v1.png` | George / 0.45 / 11 |
| Developer (makevoid in the source lesson) | `characters/char-dev-v1.png` | Liam / 0.5 / 41 |

Retain professor right-hand pointer/left-hand chalk and developer right-arm laptop, pocket can, adult proportions and flat-tone stubble. Original prompts are in `prompts/char-prof-v1.txt` and `prompts/char-dev-v1.txt`; the developer prompt's early “Luca” name predates the final display-name correction. Use the sheets as identity references, not as whole-scene images or pose sheets for H3. Create one clean pose on green for each performance.

Defaults apply only if those roles are needed; remove unused roles from cast, script, generation graph, parade and credits. Do not regenerate retained identities. Register each selected sheet through MCP after production authorization:

```json
{"project":"/absolute/lesson","task":"ref:register[char-prof-v1,.skill/assets/lesson/characters/char-prof-v1.png]","options":{}}
```

This uploads the exact local bytes, records provenance and is idempotent for the same identity. It rejects overwriting a different identity in that RUN. Register the developer similarly when used. Define identity runs with `steps: [Steps::RefBase]` and import their `ref_base` into scenes, or use `refs: ["char-prof-v1"]` on keyframes. A `ref:register` upload supplies the URL expected by those references. Only register selected cast.

Only the professor and developer are bundled. Additional or replacement characters require an explicit brief and their own approved identity, voice and assets.

## World and reusable performances

- `plates/classroom.png`: empty warm lecture hall, board rectangle at **x237 y87 w1430 h529** in 1920×1080 space; stage around y874, foreground desks y900+.
- `plates/developer-room.png`: bundled optional change of setting. `plates/agent-lab.png` is omitted; regenerate it only if the lesson needs that setting.
- `props/`: transparent props, independent gears and diagram pieces with original indices. Index `path` values preserve source-project locations; resolve each sprite as `.skill/assets/lesson/props/<run>/<name>.png` in a new project. Generated object counts may differ from prompt; measure pivots/teeth before animation.
- `curtain/closed.png`, `curtain/open.png`: bundled original full-quality image templates. The corresponding MP4 animations are omitted; generate them from these stills before local green keying.
- `loops/face_prof.mp4`, `loops/face_luca.mp4`, `loops/run_luca.mp4`: omitted silent credits/reaction loops; regenerate only selected performances. They do not represent spoken performances for a new script.
- [Ending motion recipes](ending-motion.md): extracted iris, curtain, loop anchoring and credit-scroll techniques, with no dependency on the original supporting cast. Use `assets/starter/` for portable project and audio templates.

Set `plate_file: ".skill/assets/lesson/plates/classroom.png"` in a scene generation to reuse the classroom directly, without a generated keyframe or reference upload. In p5 load `/.skill/assets/lesson/plates/classroom.png` when drawing it inside your camera. Character-free scenes omit the RefBase, Keyframes and Clips steps.

After generating the required videos, use `source:` in a scene's `04_clips.yml` to process those local files:

```yaml
- name: curtain_close
  source: .skill/assets/lesson/curtain/close.mp4
  key: green
- name: curtain_open
  source: .skill/assets/lesson/curtain/open.mp4
  key: green
```

`gen:clips` then creates normal `Anim.clip` metadata and PNG sequences. Reuse bundled identities and already-generated local silent loops, but regenerate spoken acting against the new stems.

## Assets to regenerate

These files are intentionally absent from the plugin. Paths below are relative to the initialized project's `.skill/assets/lesson/`, where replacements may be saved to use the examples above. Alternatively, retain generated files under project `output/` and update the scene's `source:` or `plate_file:` path. Generate only assets selected in the lesson plan, through the existing MCP generation workflow after production authorization; see [image and H3 prompts](prompts.md) and [task/configuration examples](tasks.md). Initialization only copies the bundled files.

| Omitted asset | References and generation brief |
|---|---|
| `curtain/close.mp4` | Use bundled `curtain/open.png` as the starting image and `curtain/closed.png` as the closing target. Animate the red velvet panels folding shut, preserve the gold valance, lock the camera, and keep exposed stage areas flat chroma green. |
| `curtain/open.mp4` | Reverse the still-image roles: start closed, part the panels to reveal flat chroma green, finish open. Match the closing clip's design and framing. |
| `loops/face_prof.mp4` | Edit `characters/char-prof-v1.png` into one clean close-up pose on green; animate a silent blink, eyebrow lift and small head reaction with a closed mouth. Preserve the professor's identity. |
| `loops/face_luca.mp4` | Edit `characters/char-dev-v1.png` into one clean close-up pose on green; animate a silent blink and subtle amused or drowsy reaction, returning to the starting pose. `luca` denotes the developer. |
| `loops/run_luca.mp4` | Use the developer sheet to create a full-body side-facing pose on green, then a silent run cycle in place. Keep the entire silhouette inside the frame and the camera locked; p5 supplies travel across the card. |
| `plates/agent-lab.png` | Generate an empty 16:9 cartoon agent laboratory using `plates/classroom.png` and `plates/developer-room.png` as style references: warm cel shading, workbenches, machines and blank display areas, with clear staging space. No people or generated lettering. |

For animations, use the configured H3 workflow and current schema, normally a five-second silent clip, with actual reference images supplied in the request. Review identity, curtain continuity, keying edges and loop seams. Measure fresh clip landmarks before adapting the ending timing tables; the archived timings describe the omitted originals. Save generation metadata in the project and credit replacements as newly generated. Do not compare replacements with the original hashes in `regenerate_when_needed`, and keep generated media out of the distributed plugin repository.

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
