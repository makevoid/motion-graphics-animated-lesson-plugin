# Music video production plan

## Brief and approval scope

Song path, duration, supplied prompt, intended audience, aspect ratio, 24fps timeline, delivery resolution. State the requested mood and chaotic/quiet balance. Record the proposed model call counts, generated seconds, pricing sources/uncertainty and retry allowance. Record what approval will authorize.

## Creative direction

The one-sentence premise, opening hook, main peak/drop, emotional arc, ending and recurring visual joke. Visual medium, rendering/materials, lighting, texture, typography if used, camera language, visual density and moments of restraint. Explain how the chosen look suits the song and brief. Require hyper quality, interesting detail, expressive animation and potential fun/virality without promising audience outcomes.

Style bible: the exact style paragraph pasted into every image prompt, including background treatment, colour anchors and the permitted shading, gradients or lighting variation. Choose palette size to suit the style; specify hex values where exact matching matters and share those constants with p5. Select typography and textures for this direction rather than inheriting the bundled examples.

Composition rule: characters are generated alone on chroma green and composited by p5 over still plates and drawn graphics. List every full-frame H3 shot with its reason; none is the expected answer.

## Research

Link RESEARCH.md. For each selected detail: source URL/date, accurate fact or inspiration, visual treatment and scene ID.

## Character bible and prompts

For each cast member: stable ID/version, role, silhouette, face, hair, clothing, palette, personality, expression/pose sheet, no-change anchors, character generation prompt, permitted image edits and reference dependencies. Include secondary characters introduced later and the replacement/versioning policy.

## Full-song storyboard

| Scene/run | Start frame | Frames/end | Song section/lyrics | Acting/mouth targets | Camera and layers | Layer sources (H3 sprite / still plate / p5) | Graphics/text/callback | VFX/SFX cues | Asset dependencies |
|---|---|---|---|---|---|---|---|---|---|

Repeat an explicit scene block for every row:

- Keyframe/image edit prompts and character references; one character, one pose and flat chroma green per character keyframe.
- H3 prompt(s), first/end frame, 1080P, generated seconds, exact stem interval, placement interval and no retiming constraint for singing.
- p5 placement in normalized coordinates, entrances/exits, focal bounds and layer order.
- Text copy with timing; research detail and payoff.
- VFX cue frames/durations; SFX source, time and approximate level.
- Acceptance: identity, animation, mouth alignment, readable placement and intended joke.

## Production waves

First 2 pilot assets, next 3–4, next 4–8, then 6–10 repeatedly. Name the first assets and opening/peak priorities. List dependency groups and shared immutable references. Describe how failed assets are corrected within the allowance and how the complete song is covered.

## Review and delivery

Opening/peak lipsync playback, sprite alpha edges, layout bounds, cut continuity, soundtrack continuity, VFX on/off comparison, SFX levels, final frame count, ending, clean/VFX delivery paths and known uncertainty.
