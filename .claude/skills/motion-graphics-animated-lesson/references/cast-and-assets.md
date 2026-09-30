# Preserved cast, classroom and fonts

The portable pack is `assets/lesson/`, copied into each initialized project at `.skill/assets/lesson/`. `manifest.json` records original relative paths, byte counts and SHA-256 values. These files are preserved from `video-session14/aicodegen`; no absolute path to that project is required at runtime.

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
- `plates/developer-room.png` and `plates/agent-lab.png`: optional changes of setting.
- `props/`: transparent props, independent gears and diagram pieces with original indices. Index `path` values preserve source-project locations; resolve each sprite as `.skill/assets/lesson/props/<run>/<name>.png` in a new project. Generated object counts may differ from prompt; measure pivots/teeth before animation.
- `curtain/closed.png`, `curtain/open.png`: original full-quality image templates. `curtain/close.mp4`, `curtain/open.mp4`: silent source H3 clips, ready for local green keying.
- `loops/face_prof.mp4`, `loops/face_luca.mp4`, `loops/run_luca.mp4`: silent credits/reaction loops. They do not represent spoken performances for a new script.
- [Ending motion recipes](ending-motion.md): extracted iris, curtain, loop anchoring and credit-scroll techniques, with no dependency on the original supporting cast. Use `assets/starter/` for portable project and audio templates.

Set `plate_file: ".skill/assets/lesson/plates/classroom.png"` in a scene generation to reuse the classroom directly, without a generated keyframe or reference upload. In p5 load `/.skill/assets/lesson/plates/classroom.png` when drawing it inside your camera. Character-free scenes omit the RefBase, Keyframes and Clips steps.

Use `source:` in a scene's `04_clips.yml` to recut a preserved silent video without generation:

```yaml
- name: curtain_close
  source: .skill/assets/lesson/curtain/close.mp4
  key: green
- name: curtain_open
  source: .skill/assets/lesson/curtain/open.mp4
  key: green
```

`gen:clips` then creates normal `Anim.clip` metadata and PNG sequences. Reuse identities and silent loops, but regenerate spoken acting against the new stems.

## Style and typography

Premium 2D cartoon, about 2.5 heads tall, head around 40%, dark plum-black ink `#1B1A22`, flat cel fills with one soft shadow and warm rim light, matte surfaces. Chalkboard `#1E3B34`, chalk `#F3EFE4`, paper `#F6EEDC`, amber `#FFB53D`. No generated lettering. Character green/teal must not collide with the chroma key. Preserve this style unless the user requests another.

Fonts in `fonts/` are copied automatically into the new project's `tools/p5/fonts/`:

| Files | Purpose |
|---|---|
| `chalk.ttf` (Chalkduster) | board headings/write-on |
| `mono.ttf`, `mono-andale.ttf` (SF Mono, Andale Mono) | code, terminal, precise punctuation |
| `din-cond.ttf`, `din-alt.ttf` | titles, small credit role headings |
| `body.ttf`, `body-med.ttf`, `body-black.ttf` (Roboto) | captions, body, emphasis |
| `math.otf`, `math-it.otf` (STIX) | equations |
| `hand.ttf` (Bradley Hand) | handwritten jokes and asides |

`fonts/original-selection.json` preserves original source locations as provenance, not a runtime dependency. `init` writes working project font paths. Load exact names via `Anim.fonts`, then preview punctuation and required language glyphs. Font files retain their originating licenses; preserving these user-supplied project assets does not relicense them under the toolkit's MIT license. Use appropriately licensed substitutions for distribution where needed, and credit actual faces used.
