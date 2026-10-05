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
| core | skill metadata/reference links, CLI help/task discovery, intake/initialization and overwrite rejection, literal shell arguments, subprocess errors, plan approval invalidation, wave progression/dependencies/resume, monitored worker journals, identity import with byte/provenance validation, noncontiguous assembly rejection, Fal HTTP submit/poll/result/cache, schema rejection and queue errors |
| media | real FFmpeg/ffprobe + ImageMagick + Python audio duration/silence/energy, local soundtrack processing without a Fal client, full-master cue offsets and first-render overlay manifests, cut detection, character/keyframe/H3 adapter workflow with synthetic Fal responses, green alpha edges, p5 sprite bounds/placement, actual moving pixels, deterministic repeat, overlay/assembly frame counts and soundtrack correlation, SFX timing/peak behavior, mouth-alignment diagnostic |
| swift | real Swift build and character-scene VFX render, cue-on/cue-off pixel/luminance checks, audio/frame preservation and invalid effect rejection |
| live | paid real Sunburst character → edit → H3 768P animation (5 s is the H3 minimum), real Whisper/Demucs/SFX audio outputs and a local composition/VFX pass using the generated assets |

Offline synthetic media is deliberately simple so placement/alpha/timing are measurable. Generated projects retain a `.skill/` copy of the instructions and references, so their copied test suite can validate the documentation as well. Mocked Fal responses verify client and pipeline plumbing; they cannot demonstrate the provider's current output quality or lipsync. Live generation is stochastic: tests enforce media/schema/placement invariants and save artifacts for visual review rather than asserting subjective beauty.

Lesson tests additionally verify topic-only initialization, readable asset hashes, regeneration recipes and default voices, v4 request settings and cached alignment, tail extension without word drift, local bed reuse without provider calls, speech ducking, intentional silence, caption speaker metadata, direct local plates and final frame preservation.

The media profile also checks seeded alpha-component cleanup through the public Ruby task: retained subject RGBA and soft alpha remain exact, detached lettering disappears, the original file remains unchanged, and invalid/missing seeds fail without publishing a partial sequence.

## Paid live E2E

Live tests are excluded from routine runs. They require an explicit opt-in plus a real song excerpt and recognizable spoken-line words. This test invocation authorizes the listed test calls; it does not approve a new production plan.

```sh
LIVE_FAL=1 LIVE_SONG=/absolute/short-song.wav LIVE_LYRICS='known sung words' PROFILE=live ruby scripts/mv.rb test
```

Supply `FAL_AI_API_KEY` via the environment for this explicit developer CLI test. The plugin's sensitive key is scoped to its MCP server, which does not expose the live test runner. Budget per run: one Sunburst xhigh generation, one Sunburst xhigh edit, one five-second H3 768P clip (a harness-only saving; real projects keep the 1080P default), one Whisper transcription, one Demucs separation and one SFX generation. Local composition/VFX adds no model charges. No automatic paid rerolls. Run only after accepting those costs. Output is retained for inspection. A provider failure ends the test with request evidence; resume/recover before paying again.

## Behavioral rehearsal for the Markdown workflow

Executable tests check document links/interfaces; they do not prove an agent will obey creative prose. Rehearse these scenarios using the skill with a disposable project. Paid calls require authorization; preserve authorization already given for a bounded regeneration:

1. Topic + audience, no song: initialize without placeholder audio, research and script, plan a full lesson including its ending.
2. A software tutorial with default cast: generate the selected professor/developer sheets and classroom from the supplied prompts, keep George/Liam settings, and generate intro/titles from the original prompts. Reuse approved project images and music thereafter.
3. A biology lesson with no developer, or a brief with no professor: omit that role from narration, assets and credits. Explicit cast/voice overrides win.
4. An approved script: generate timestamped turns, build speaker stems, freeze measured scene frames, review the hook and a teaching scene before expanding.
5. A new ending: inspect the SVG layout guides, export PNG previews locally if needed, generate matching curtain stills from the prompts and pass the accepted images as references, use current sources/cast/models in credits.
6. Failed clips, drift, unreadable code or missing frames: repair and review. Tail extension must preserve spoken word timing.
7. Interrupted Fal polling: resume the saved receipt, avoiding another charge.
8. Reused music: accepted project or user-supplied intro/titles files retain identical hashes, local mix ducks under speech and preserves picture/frame count. No paid generation for local tracks.

Review the generated plan against the user's actual taste and listen/watch opening and peak clips. Record behavioral findings in a review document; do not describe a structural Markdown check as full agent evaluation.
