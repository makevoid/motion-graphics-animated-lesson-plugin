---
name: motion-graphics-animated-lesson
description: Create and revise narrated cartoon lessons and educational explainers from a topic, paper, repository or script, using recurring characters, ElevenLabs dialogue, timed diagrams, music ducking, a curtain-call ending and animated credits. Use for complete lessons or revisions to their script, characters, scenes, animation and sound.
license: MIT
metadata:
  version: "0.2.0"
  compatibility: Designed for Claude Code and adaptable to Codex. Requires Ruby 3.2+, Bundler, FFmpeg, ImageMagick, Python 3, Node.js 22+ and Chrome. Optional Swift VFX requires macOS 14+ and Swift 5.9+. Fal tasks use the sensitive FAL_AI_API_KEY plugin option or the environment variable in standalone development. Bundled media and fonts retain their own provenance and terms.
---

# Cartoon animated lessons

Create a clear, engaging lesson with expressive cartoon acting, a concrete opening hook, several teaching scenes, a running visual joke, a satisfying synthesis and a funny high-note ending. Narration is the timing master; music supports the speech. Default to the warm, cel-shaded classroom style of the bundled Software Archaeology lesson. Use the user's requested style, cast, format and ending when they differ.

## Default cast and visual continuity

**Professor Otto Regress** is the default lecturer: elderly chibi professor, bald crown and fluffy white side hair, bushy eyebrows, tortoiseshell glasses, white moustache, brown tweed, mustard vest, burgundy bow tie. Pointer in his RIGHT hand, chalk in his LEFT. **ElevenLabs Eleven v4 voice: George, stability 0.45, seed 11.**

**The developer** is the default developer/demo character: adult chibi, messy dark-brown hair, tired hopeful eyes, flat-tone stubble, charcoal hoodie, headphones around neck, blue jeans and white sneakers. Laptop under his RIGHT arm; blank silver can in the hoodie pocket. **ElevenLabs Eleven v4 voice: Liam, stability 0.5, seed 41.** The reference lesson calls him makevoid; use that name when relevant or requested, otherwise label him “the developer.” Some archived files call him Luca; that is an internal legacy identifier, not a different character.

These are **optional defaults, not compulsory roles**. Use both when the lesson needs a lecturer and a developer. Omit the developer for a lesson without a developer/demo role; omit the professor for a brief without a host. Explicit replacements, different voices, new casts and character-free lessons override the defaults. Do not insert bots or software jokes into unrelated subjects. Keep default identity and voice settings whenever their roles are retained.

Reuse the actual bundled sheets, classroom, props, fonts and silent loops; do not recreate their identity from prose or require the original `video-session14` directory. Read [cast and assets](references/cast-and-assets.md) before preparing characters. Read [the reference lesson study](references/reference-lesson.md) to understand the staging and sample scene code.

## Execution and project setup

Ruby is the execution entry: `ruby "${CLAUDE_SKILL_DIR}/scripts/mv.rb" ...`, or the copied project's Ruby/Rake tasks. Ruby services invoke Fal, FFmpeg, ImageMagick, Python, Node/p5 and optional Swift. Extend a Ruby service and thin task when needed. Native file editing, browsing, media inspection and available agent tools remain appropriate. Resolve `${CLAUDE_SKILL_DIR}` relative to this file when the host does not substitute it; it is not a shell environment variable.

Create projects outside the plugin. Topic/script intake does **not** need a song or placeholder audio:

```sh
ruby "${CLAUDE_SKILL_DIR}/scripts/mv.rb" init --project /absolute/lesson --prompt-file /absolute/brief.md
ruby "${CLAUDE_SKILL_DIR}/scripts/mv.rb" --project /absolute/lesson setup
ruby "${CLAUDE_SKILL_DIR}/scripts/mv.rb" --project /absolute/lesson doctor
```

Initialization copies the runtime, reusable asset pack, starter voice/timeline configs and preserved fonts. `--song /absolute/narration.wav` optionally imports an existing narration master; the old flag is retained for compatibility. Do not run audio analysis until that file exists or TTS has built it. `audio/song.wav` and `gen:music` are legacy runtime names for the **narration master** and its local section cuts; background music uses `music:gen` and `music:bed`.

Read [credentials](references/credentials.md) before Fal work. The `animated-lesson` MCP server exposes `run_task`/`task_status` with the plugin key. Use it for TTS, music generation, images, clips and reference uploads; use the Ruby CLI for local setup, plan records, rendering and mixing. Never read key files or ask for secrets in chat. CLI developer mode reads `FAL_AI_API_KEY` from its environment.

## 1. Research and write the whole lesson

Use the supplied topic, artifact or script. Ask only for missing information needed to make the lesson; infer reasonable audience and duration when the brief supports it. Default 16:9, 24fps, 1920×1080; runtime section math assumes 24fps. Validate requested format changes before production.

Read [planning](references/planning.md). Inspect supplied repositories/papers and use primary sources to verify teachable claims. Record sources, dates, exact on-screen facts and planned uses in `docs/RESEARCH.md`; distinguish jokes from facts. Study supplied frame samples and motion segments, not just filenames.

Write the script as speaker turns with stable line IDs. Build: ≤15 s cold-open mystery/demo → host/title → concepts shown through examples and diagrams → complication/peak → synthesis → callback joke. Plan breaths and silent reactions, about 150 spoken words/minute as a starting point. Do not force the reference lesson's topic, robots, dates, commits or exact duration onto a new lesson.

Create a reviewable `docs/PLAN.md` from [the plan template](assets/plan-template.md): learning outcome, full script, cast/voices, visual bible, scene and clip prompts, approximate timing, research, end card, credits, generated seconds, estimated cost/call limits and bounded retries. Exact frame ranges follow measured TTS. Preserve prior authorization for an established direction; if production is not already authorized, make the complete plan reviewable before requesting approval for that production scope. Record actual consent with `NOTE='actual user instruction' ... plan:approve`. Routine work within the authorized direction/budget continues without another approval per scene. Log measured timing and routine changes outside the hashed plan in `docs/TIMING.md` and `docs/PROGRESS.md`.

## 2. Narration first; freeze measured timing

Read [narration and music](references/narration-and-music.md). Use **ElevenLabs Eleven v4** (`elevenlabs/tts/eleven-v4`) with the locked cast voices. Generate one line per speaker turn via `sfx:gen`, `SFX=narration`. Preserve voice, stability and seed on retakes; seeds are best-effort consistency, not guaranteed identical output. Retain returned character timestamps and request IDs.

Run `narration:build`, then `audio:analyze[audio/source.wav,audio]`. The builder produces a master, full-length per-speaker stems, `audio/words.json` and `audio/lines.json`. Listen, correct pronunciation/timing, and freeze the master before animation. Short 1–4 s reaction lines are useful; split speeches into H3 windows of 5–15 s. Use the relevant speaker stem, never the music mix, for speaking clips.

In `config/generations.rb`, sections cover the master exactly once using inclusive start/exclusive end frames. Cut in pauses after completed ideas. Record scene frames, global word times and section-local `audio_at` in `docs/TIMING.md`. Reserve the joke, two-second pause, iris, curtain, end card and credits in narration `tail` before rendering. Extending only the tail must not move existing words.

## 3. References, acting and explanatory graphics

Read [prompts](references/prompts.md), [production](references/production.md) and [animation/audio/VFX](references/animation-audio-vfx.md). Default image/edit model: GPT Image 2.5 Sunburst **xhigh**. Default acting: MiniMax H3 Max **1080P**. Fetch current schemas; never silently substitute models. Preserved identities are registered with `ref:register`, not regenerated. Version intentional identity changes and invalidate only their dependents.

Produce a pilot hook/title and representative teaching moment, inspect them, then expand through dependency-ready review waves. Use sub-agents when available and appropriate; otherwise use the same reviews serially. Keep each RUN owned by one worker, shared config owned by the coordinator, exact frame ranges in each brief and persistent logs. See [production](references/production.md) for wave sizes and recovery. Accept only inspected results.

One character, one starting pose per keyframe; one character per acting clip on flat #00B140, no floor/shadow/text, no green character details. Frame the figure at roughly 60–65% height with ≥10% margins. Keep the camera locked; measure unwanted H3 push-in and compensate around a stable head/feet anchor. Scenes and diagrams belong in p5 over still plates. Generate independently moving objects separately (gears need individual sprites, pivots and tooth ratios).

Use timed gestures, blinks, reactions and speaker exchanges; keep one visual focus. p5's bundled `Ex` library handles cameras, chalk write-ons, code, maths, cited concept cards and speaker-tinted captions. Use `fontWidth()` for text advance with p5 2.x, so punctuation remains readable. Keep cards ≥2.5 s, off faces; give dense material longer. Match joins or use a deliberate transition. Speaking animation plays at original speed; only silent loops/curtains may be retimed. Check actual mouth motion with audio, not just whether `target_audio_url` was sent.

## 4. Assemble, score and end on a high note

Join exact-length sections with `media:preview` against one unbroken narration master. Reuse the five original instrumental beds byte-for-byte by default, especially `intro.wav` for the hook and `titles.wav` for curtain/credits. New music is optional. `music:bed` loops/fades these sources and ducks them smoothly under speech. Mix sparse SFX last. Preserve narration-only, narration+music and final SFX versions.

Read [ending and credits](references/ending-and-credits.md) and [the text/image layout template](assets/templates/ending/TEMPLATE.md); inspect its PNGs and use them as model references when generating visual layers. Default finish: callback joke/last line → music stops → **2.0 s silent reaction** → tada + **1.0 s iris to black** → red velvet curtain closes/folds, holds and reopens → lesson-specific end card and cast parade → animated film credits → final short callback. Reuse the bundled curtain clips. An optional three-second rewind uses the new lesson's own frames. Keep the end-card clock continuous across sections; retime cues from measured boundaries rather than copying source timestamps.

Preserve the reference credits' structure and playful character treatment, while naming only the cast, voices, models, tools, fonts, sources and people actually used. Do not claim the original creator, agent counts, model resolutions or software-history facts for a new production. Use alternating animated face vignettes, readable credit blocks and topic/cast-specific joke credits.

## 5. Verify and deliver

Preview event frames, speaking close-ups, camera extrema, section joins and the entire ending; inspect alpha edges, hands/props, captions, facts and credit readability. Review music/SFX levels by listening and reading reports. Check all three exports retain identical frame counts and no AAC tail truncation. Local tests from [testing](references/testing.md) verify toolkit behavior; visual and audio review establish creative quality.

Deliver the complete final lesson, narration-only and music versions, contact sheet, plan/research/timing, reusable references, prompts and provenance/credit records. Report unresolved limitations plainly. Finishing the pilot is not completion of the lesson.
