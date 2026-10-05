# Animation, audio and effects recipes

## Separation of work

H3 supplies expressive, self-contained characters on chroma green; p5 supplies the world around them: exact timing, camera movement, environments, props, text, diagrams and layer order. A full-frame H3 plate is a justified exception, not an equal option (see "Self-contained characters" in [prompts.md](prompts.md)). Python removes backgrounds, measures audio and composites sound. Swift applies final frame-cued camera, light and signal effects. Ruby services own all execution and manifests.

## p5 scenes and overlays

The renderer loads `tools/p5/lib/{core,time,fx,type,paper,riso,explainer}.js` and calls a sketch for each frame at `t=frame/24`. Per-frame random seeds make repeats deterministic. Full-scene sketches draw on a background plate selected for the scene; overlay sketches leave transparent areas over an H3 plate. Load project fonts chosen for the approved art direction through `Anim.fonts`. Select drawing, texture and typography helpers to suit that direction. Library names and bundled examples do not prescribe a visual style.

### Project fonts

Fonts are **not bundled**. Any TTF/OTF font installed on the machine can be used. Pick them before creating the video, and choose faces that suit the approved art direction, the language glyphs and the licence you need.

1. Run `fonts:list`. It scans the common font locations and prints every `.ttf`/`.otf` file:
   - macOS: `/System/Library/Fonts`, `/System/Library/Fonts/Supplemental`, `/Library/Fonts` (all users), `~/Library/Fonts` (current user)
   - Linux: `/usr/share/fonts`, `/usr/local/share/fonts`, `~/.local/share/fonts`, `~/.fonts`
   - Windows: `C:/Windows/Fonts`
   Filter the long list, e.g. `... fonts:list | grep -iE "chalk|mono|din|stix|hand"`.
2. Edit `config/fonts.json`. It maps stable project filenames to absolute source paths. `init` seeds it from `assets/lesson/fonts/default-selection.json`, which uses stock macOS fonts (see [cast and assets](cast-and-assets.md) for the roles). Replace any path that is missing or unsuitable on this machine, and add new names for extra faces. Use single-face files, not `.ttc` collections.
3. Run `fonts:copy[config/fonts.json]`. It copies the selection into `tools/p5/fonts/`, fails on missing paths and refuses to overwrite a filename with different bytes (choose a new filename for a replacement).

Load the fonts in sketches with `Anim.fonts`, e.g. `{chalk: "chalk.ttf", title: "din-cond.ttf", body: "body-med.ttf", mono: "mono.ttf"}`. Preview punctuation and the required language glyphs. Setup never downloads fonts. Credit the faces you actually used and follow their licences.

The bundled `Ex` library supplies `cam`, `withCam`, `img`, `puppet`, `talk`, `chalk`, `chalkLine`, `arrow`, `code`, `window`, `card`, `stamp`, `caption`, `phrases`, `math`, `lowerThird` and palette `C`. Inspect `tools/p5/lib/explainer.js` for exact arguments; see the minimal scene below and [ending motion recipes](ending-motion.md) for usage. Use `async load()` in `Anim.sketch`, not a p5 setup callback. Use `fontWidth()` for advance widths with p5 2.x. Code/caption punctuation must remain legible.

This minimal example demonstrates sprite placement and a camera transform. Supply the background, graphics, colours and any typography from the scene's approved design.

```js
Anim.sketch({
  async load() {
    this.speaker = await Anim.clip('talk');
  },
  draw(t, frame) {
    // Scene coordinates here assume the default 1920x1080 plate.
    push();
    translate(960, 540); scale(1 + 0.04 * Math.sin(t)); translate(-960, -540);
    this.speaker.draw(this.speaker.at(t), 1300, 560, 820);
    pop();
  }
});
```

`Anim.clip(name).at(t)` uses `audio_at`; `.frame(index)` is clamped unless loop is requested. `.draw(image,x,y,height)` centers the cropped sprite. `.place(image,x,y,width)` preserves its original source-frame position via `box`/`src`. Do not mistake the full cutout canvas bounds for the character's visible bounds. Draw background → distant graphics → behind-character text → sprite → foreground particles/captions.

Optional helpers; choose only those that fit the approved look and choreography:

| Area | API |
|---|---|
| Data/cues | `Anim.data(name)`, `Anim.cues(words)` where words are `{w,s,e}`; `cue(word,nth)` |
| Timing | `progress`, `tween`, `ease`, `live`, `envelope`, `steps`, `sinceStep` |
| Transforms | `at(x,y,{scale,rot,alpha},fn)`, `pop`, `slap`, `slam`, `shake` |
| Draw | `sparkle`, `twinkle`, `trace`, `knockout`, `typed`, `karaoke` |
| Texture | `slip`, `misregister`, `grain` |

Read implementations for precise optional arguments. Render the bundled smoke sketch through `anim:render` to exercise typography/helpers with browser system fonts; preview the production sketch separately to verify its copied fonts. Keep memory bounded: sprites are loaded as PNG sequences, so crop them and reduce `scale` for small on-screen characters. Never shrink the lead's mouth below reviewable resolution.

Choreography recipes: a mascot runs at the head of a curve leaving a trail; a fall accelerates the camera/world while holding the character in the focal area; a reveal zoom shows the whole diagram; a crowd pose swap ripples outward; a word appears behind hair via layer order. Tie entrances to actual words and beat accents. When text is used, check spacing and readability with the selected font and treatment. Check all important event frames with `anim:preview`, then watch the complete section.

## Character cutouts and lipsync

Remove detached generated captions from an existing alpha sequence with `media:keep_component[source_dir,new_out_dir,seed_x,seed_y]` through the Ruby CLI. It keeps exact RGBA values of the four-connected nonzero-alpha silhouette containing the seed; no dilation joins text back to hair or props. Choose a torso pixel occupied in every frame. Missing/transparent seeds fail explicitly, and sources remain unchanged. This cannot remove lettering touching the body, instrument or hair: use a deliberate mask or revise the asset. Inspect all motion afterward, including semi-transparent edges and moving limbs.

Use chroma green for cream/white faces/clothes; paper keying can erase them. Inspect the alpha matte, hair, hands, feet and spill over light/dark backgrounds. `media:sprite_box` helps estimate source-pixel bounds; `box` is a crop and `seed` chooses the connected paper-key component. Recut locally before paying to regenerate a good H3 performance.

H3 may invent captions or interface elements even when the prompt forbids text. Inspect the entire performance, including initially empty space. Disconnected text in a keyed sprite can be removed locally with a reviewed mask/component filter; check moving fingers, hair and instrument tips before accepting the cleanup. A deliberately designed opaque p5 panel can cover unwanted background UI when it preserves the subject and fits the composition. If unwanted text intersects the face/body and cannot be repaired cleanly, use the approved regeneration allowance. Keep spoken-line typography under p5 control.

Use the full-length per-speaker stems from `narration:build`, not separately offset clips. Demucs is only useful for supplied mixed recordings. Set `audio_at` in section-local seconds; the service adds `music_offset`. Gate modestly only if instrumental bleed causes mouthing in pauses. Short tail audio must be padded to meet H3's two-second input minimum. Use visible lips, jaw motion, brows, head/shoulder acting, anticipation and follow-through. At teaching peaks synchronize articulation and the acting accent, then add p5 camera/graphics around it.

`media:mouth` correlates darkness in a mouth crop against vocal energy at 24fps, checking lags from -6 to +6 frames. Supply a mouth ROI in the **cutout image's coordinates** and the full-master audio start. It is a heuristic for static framing and sufficiently visible dark mouth shapes. Moving faces, low contrast and synthetic silence can make it inconclusive. Verify phonemes/visemes and pauses by watching with audio. Fix timing errors at the source; never stretch the narration master or speed-change visible speaking.

## Sound and assembly

Read [narration and music](narration-and-music.md) for Eleven v4 lines, timing and the three-pass narration → ducked beds → SFX flow. The original five bed prompts are bundled; generate selected intro/titles or other beds in the project after production authorization, then reuse them. `music:gen` generates beds from those prompts; `gen:music` cuts narration sections.

Keep `audio/song.wav` as the full master. Use integer frame sections; unbroken-master assembly validates each section's frame count and contiguity, joins picture and muxes one continuous narration master. Do not concatenate independently encoded/faded audio segments. Preserve the original input and speaker stems separately. Keep a clean render before sound effects.

`prompts/finish-sfx/sfx.yml`:

```yaml
source: output/clean_music.mp4
out: output/with-sfx.mp4
rel_db: -6
peak_db: -6
max_gain_db: 18
sounds:
  pop: {prompt: "One short dry cartoon cork pop, isolated, no music or voice", duration: 2, seed: 7}
  flatline: {tone: 1000, duration: 1}
cues:
  - {at: 1.25, sound: pop, rel_db: -5, len: 0.25, fade: 0.03}
```

Stable Audio SFX is paid; a steady tone is synthesized locally. SFX are cached by prompt, duration, seed and negative prompt. Mix trims leading silence, sets cue loudness relative to music in that window, caps gain and peak-limits. Use exact master times, not cut-relative times. Check dialogue intelligibility, silence jokes and audible but subordinate effects. The final mux can add codec peaks, so listen and measure the delivered file if close to full scale.

## Swift VFX and p5 light layers

`prompts/finish-vfx/cues.yml`:

```yaml
source: output/with-sfx.mp4
out: output/finished.mp4
cues:
  - {fx: punch, f: 24, dur: 8, amt: 0.05, radius: 2}
  - {fx: glow, f: 27, dur: 12, amt: 0.4, radius: 12}
  - {fx: dark, f: 144, dur: 3, hold: 1, amt: 0.8}
```

Core Image supports `punch`, `zoom`, `shake`, `whip`, `mblur`, `edgeblur`, `glow`, `flash`, `dark`, `rgb`, `glitch`, `tv`, `grain`. `f`/`dur` are integer frames; `pre` starts a transition early. See `tools/vfx/Sources/mvfx/Effects.swift` for exact knobs. `leak`, `flare`, `glints` are p5 light cues: set `lights: tools/p5/examples/lights.js` for the bundled leak/flare/glints implementation, or author `05_lights.js` in the VFX prompt folder (or set `lights:` to another sketch), read `Anim.data('vfx').cues`, draw on transparent black, and use screen blending in Swift. A light cue without its sketch is an error, not an invisible effect.

The Swift service builds the package through Ruby, uses FFmpeg rawvideo pipes and copies the source audio. Inspect a short clip and stills before the full render. Use distinct output paths for every finish revision. Effects should follow onsets/cuts/spoken words; start glow after a flash to avoid whiteouts, avoid double grain if p5 already draws it, and preserve deliberate quiet frames. A no-cue VFX render should resemble the clean encode; cued frames should differ measurably, which RSpec checks.
