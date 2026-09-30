# Ending layout and model reference template

Use this text together with the PNGs in this directory and the original curtain images in `../../lesson/curtain/`. All layouts use **1920×1080, 16:9, 24fps**, origin top-left, 96 px horizontal / 54 px vertical text safety. `layouts.json` contains editable region coordinates; matching SVGs are editable vector guides and PNGs are ready to attach as model references. Background #1B1A22, chalk #F3EFE4, accent #FFB53D.

## Reference-image assignments

| New asset/layout | Attach or inspect | Purpose |
|---|---|---|
| End card | `end-card.png` | thesis at top; a callback diagram; actual sources; cast parade at bottom |
| Credit title | `credits-title.png` | large condensed title, chalk subtitle, artifact line |
| Cast credits | `credits-cast.png` | alternating face vignettes, name, voice/model, character-specific aside |
| Crew/technology | `credits-production.png` + `reference-credits-production.png` | two columns, amber roles above light text |
| Final joke | `final-joke-card.png` | readable closing hold, a small callback, punchline/music stop |
| Curtain design | `../../lesson/curtain/closed.png` + `../../lesson/curtain/open.png` | exact red velvet, folds, gold fringe, matching valance |
| Curtain choreography | `reference-curtain-folding.png`, `reference-curtain-closed.png`, `reference-curtain-reveal.png` | close/fold, hold, reopen over the end card |

`reference-*.png` are frames of the original finished lesson, not content for the next video. Their Software Archaeology text and credits demonstrate placement. Replace all dates, names, sources, producer lines, jokes and model claims with the current production's data. The cast guide includes only professor and developer slots; omit any unused role. Original frames containing other characters are excluded.

## Text template for an image/edit model

> Reference image 1 is the layout guide; subsequent images are the approved professor/developer identity sheets or curtain references. When supplied, an original character-free lesson frame demonstrates style and spacing. Preserve their identity and the warm cel cartoon style. Create only the requested clean visual layer: {curtain / background / one character pose}. Keep {named layout regions and coordinates} clear for typography composited later. Do not render the guide labels, coordinates, lesson text, credits, logos or captions into the image. Keep the supplied curtain's gold valance and red folds consistent across open and closed states. For an open curtain, the stage opening alone is flat chroma green #00B140; no green on the velvet. All type will be drawn exactly in p5.

Use image references in the actual generation request (`image_urls`/keyframe `refs`), not only filenames in a text prompt. Prefer the original curtain assets/performances unchanged when no redesign is requested. To create a different curtain, register its reference images and edit them; generate opening/closing H3 with the first/end images swapped. Reuse does not require model calls.

## Text template for the p5 scene author

> Build the ending from `layouts.json` and the matching PNGs. Replace the placeholders with verified current-lesson content. Use bundled DIN for titles/roles, Roboto for readable credits, Chalkduster for classroom headings, mono for code, Bradley Hand for jokes. Draw text in p5 with advance widths, wrap long values within their assigned regions, and keep credits readable for at least 2.5 seconds per entry. Draw the card and parade behind the keyed curtain. End-card local time must continue across its section boundaries. Do not scale the reference screenshot as a finished card.

Fill the following before rendering:

- Lesson title / subtitle / final takeaway:
- Source/artifact line and compact citations:
- Cast actually appearing: display name, sheet/loop, actual voice/model, relevant humorous aside:
- Creator/producer, if known:
- Actual image, animation, voice, music, SFX models and settings from manifests:
- Tools and typefaces actually used:
- Joke-credit role → character/topic payoff:
- Final callback and cue that stops the titles music:

## Timing template (relative to measured final spoken word E)

1. E: teaching music stops; hold the reaction in silence until E+2.0.
2. E+2.0: tada; circular iris closes over 1.0 s, thin amber rim, `inCubic`.
3. About E+3.25: curtain section starts on black; fade in open curtain, close/fold, hold, reopen.
4. Around curtain-local 4.25 s: end-card clock begins; reveal the current lesson's end card behind the parting panels.
5. Curtain-local ~6.25–6.7 s: curtain flies outward (scale toward 1.35) and fades; card/parade continue. Hold card for readable sources (source example about 6 s total).
6. Optional 3 s rewind made from this lesson's own frames, then title/cast/crew/joke credits. Otherwise cut/transition directly into credits.
7. Credits length adapts to cast and text, around 20–35 s; ease scroll in/out, hold final card ≥2.5 s and land the final callback.

Use exact integer section frames and measured clip landmarks; the above offsets are choreography starting points. The source curtain is 10.25 s and its credits 30 s. Do not insert those durations blindly into a shorter lesson.

## Reference frame provenance

Source: `video-session14/aicodegen/output/with-sfx.mp4`, 5283 frames, 220.125 s, 1920×1080/24fps. Retained frames extracted at: folding 178.5 s; closed 180.4 s; reveal 182.5 s; production 208 s. These are source-study timestamps only.
