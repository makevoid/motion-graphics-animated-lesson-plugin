# Character, image-edit and H3 prompts

Use this creative directive in each character/scene/H3 prompt and sub-agent brief, followed by specific visual instructions:

> This asset belongs to a hyper quality, very interesting and potentially very fun viral music video. Deliver polished visual detail and expressive character animation, with surprising, relevant ideas from the researched creative plan. The overall video defaults to energetic, chaotic choreography that constantly hooks attention while keeping its main action readable.

For a still image, specify the lively pose/expression that will support animation; do not ask a still generator to produce motion. Do not instruct the generation model to browse: the coordinating agent performs web search and supplies the selected details. Reuse the approved style paragraph in every prompt.

## Identity sheets: GPT Image 2.5 Sunburst xhigh

Default class `Fal::Models::GptImage25`, endpoint `openai/gpt-image-2.5/sunburst/text-to-image`. Write `prompts/char-<id>-v1/01_ref_base.txt` with the actual prompt. Request one coherent character sheet: front full body, profile/back if useful, and distinct expressions; specify proportions, silhouette, hair, clothing, face and color anchors. Keep sufficient limb margins. Ban lettering, captions and watermarks; p5 draws final typography.

Inspect the face and hands, anatomy, silhouette and expression range. Accept a reference only after visual review. New shots use edits of this reference; never reconstruct identity from prose alone.

## Editing/adding/replacing characters

`Fal::Models::GptImage25Edit` calls `openai/gpt-image-2.5/sunburst/edit` at xhigh. `02_keyframes.yml` can specify `base`, `refs` and `prompt`. State “same character and same illustration style,” with one intentional change per edit. Specify composition by percent of frame, face bounds and empty areas for text. Keep reference image ordering explicit for multiple characters.

For an approved swap, create `char-<id>-v2` or a versioned edited keyframe. Review it; update dependent runs/prompts; regenerate only affected keyframes/clips/overlays. Recompute sprite crop boxes and placement when hair, costume or silhouette changes. Preserve v1 and its accepted takes. A newly added cast member gets a separate identity run, linked into the same style bible.

## Animation: MiniMax H3 Max 1080P

`Fal::Models::H3MaxImageToVideo`, endpoint `minimax/h3-max/image-to-video`; defaults `resolution: 1080P`, prompt expansion disabled. The shipped pipeline uses 5–15 second clips; check the fetched schema before generation. Split long actions, and trim longer silent clips for brief edits. Never retime visible singing.

Prompt structure: identity/style → framing → exact lyric/performance → two or three timed acting beats → camera → background invariants → exclusions. Describe articulation, jaw and cheek motion, pauses, glances, head tilts, shoulder/hand acting and follow-through. Avoid a floating still portrait with only camera movement.

Example: same approved singer, medium close-up; articulates the supplied lyric with a closed mouth during its pause, raises one eyebrow on the punchline and turns toward the prop on the final word. Keep the whole face visible. For a cutout: locked camera, feet/limbs within frame, perfectly flat chroma green #00B140 throughout, no green clothes, no shadows on the background, no text, no extra people, preserve the graphic style.

Use `audio:` as a full-song-aligned vocal WAV and `audio_at:` in **section-local seconds**. The Ruby Clips service adds `music_offset` before cutting audio. Place it with `clip.at(section_local_t)` so the local offset is honored. H3 requires target audio at least two seconds long; pad a short ending with silence rather than shifting the words. Gate bleed only after listening; do not cut soft consonants.

Fal describes `target_audio_url` as soundtrack pinning. It is not a contractual guarantee of phoneme-accurate lipsync. Inspect opening and peak performance at normal speed, slow playback and mouth crops. The local mouth-energy heuristic only helps find gross lag/continued talking in pauses; it cannot certify visemes. Re-prompt/regenerate within the allowance if the visible performance is wrong.

## Models and evolving schemas

Fetch `openapi:fetch` and read `openapi:summary`. The wrappers validate known properties/enums/ranges when schemas exist; inspect nested/union constraints when extending a call. Add any other Fal audio/image/video model as a Ruby `Fal::Models::Base` subclass, then a service/task. Do not call an SDK or curl directly. Do not silently substitute a model or quality setting.

Official sources: [H3 API](https://fal.ai/models/minimax/h3-max/image-to-video/api), [Sunburst generation](https://fal.ai/models/openai/gpt-image-2.5/sunburst/text-to-image/api), [Sunburst edit](https://fal.ai/models/openai/gpt-image-2.5/sunburst/edit/api). Defaults were checked when this skill was built; refresh schemas for a new production.
