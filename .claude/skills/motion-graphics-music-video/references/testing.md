# RSpec verification

All test execution enters through Ruby. From the skill directory:

```sh
ruby scripts/mv.rb setup
ruby scripts/mv.rb test
PROFILE=core ruby scripts/mv.rb test
PROFILE=media ruby scripts/mv.rb test
PROFILE=swift ruby scripts/mv.rb test
```

The repository root also has `rake test`. `PROFILE=all` (default) runs all non-live examples. It fails if a required backend cannot run, including Chrome local-server restrictions or Swift on a non-macOS machine. Use a narrower profile intentionally when that backend is unavailable; report what was not exercised. Tests leave diagnostic fixtures in `scripts/tmp/` and derived review outputs under `scripts/output/`, both ignored by git.

## What is tested

| Profile | Observable behavior |
|---|---|
| core | skill metadata/reference links, CLI help/task discovery, intake/initialization and overwrite rejection, literal shell arguments, subprocess errors, plan approval invalidation, wave progression/dependencies/resume, noncontiguous assembly rejection, Fal HTTP submit/poll/result/cache, schema rejection and queue errors |
| media | real FFmpeg/ffprobe + ImageMagick + Python audio duration/silence/energy, cut detection, character/keyframe/H3 adapter workflow with synthetic Fal responses, green alpha edges, p5 sprite bounds/placement, actual moving pixels, deterministic repeat, overlay/assembly frame counts and soundtrack correlation, SFX timing/peak behavior, mouth-alignment diagnostic |
| swift | real Swift build and character-scene VFX render, cue-on/cue-off pixel/luminance checks, audio/frame preservation and invalid effect rejection |
| live | paid real Sunburst character → edit → H3 1080P animation, real Whisper/Demucs/SFX audio outputs and a local composition/VFX pass using the generated assets |

Offline synthetic media is deliberately simple so placement/alpha/timing are measurable. Generated projects retain a `.skill/` copy of the instructions and references, so their copied test suite can validate the documentation as well. Mocked Fal responses verify client and pipeline plumbing; they cannot demonstrate the provider's current output quality or lipsync. Live generation is stochastic: tests enforce media/schema/placement invariants and save artifacts for visual review rather than asserting subjective beauty.

## Paid live E2E

Live tests are excluded from routine runs. They require an explicit opt-in plus a real song excerpt and recognizable lyric words. This test invocation authorizes the listed test calls; it does not approve a new production plan.

```sh
LIVE_FAL=1 LIVE_SONG=/absolute/short-song.wav LIVE_LYRICS='known sung words' PROFILE=live ruby scripts/mv.rb test
```

Supply `FAL_KEY` via environment or the normal key file. Budget per run: one Sunburst xhigh generation, one Sunburst xhigh edit, one five-second H3 1080P clip, one Whisper transcription, one Demucs separation and one SFX generation. Local composition/VFX adds no model charges. No automatic paid rerolls. Run only after accepting those costs. Output is retained for inspection. A provider failure ends the test with request evidence; resume/recover before paying again.

## Behavioral rehearsal for the Markdown workflow

Executable tests check document links/interfaces; they do not prove an agent will obey creative prose. Rehearse these scenarios using the skill with a disposable project and no paid calls until the user approves:

1. “Make a music video” without a song/prompt: request the two missing inputs.
2. Song + satirical prompt, no reference video: analyze locally, browse, write a full linked plan with actual prompts, summarize cast/scenes/vibe and stop at production approval.
3. Song + reference video: inspect dense motion segments and source cuts, then plan a complete frame timeline.
4. Approve plan: record real consent, allocate two independent assets, review them, then progress through the required wave sizes with dependency and slot limits.
5. Replace a character halfway through: create a new identity version and update affected dependencies without overwriting unrelated accepted work.
6. Inject failed clips, lip timing drift, unreadable overlays, missing frames or a VFX no-op: reject, repair and review before accepting the wave.
7. Interrupt during Fal polling: reuse the saved queue receipt and finish the original task.

Review the generated plan against the user's actual taste and listen/watch opening and peak clips. Record behavioral findings in a review document; do not describe a structural Markdown check as full agent evaluation.
