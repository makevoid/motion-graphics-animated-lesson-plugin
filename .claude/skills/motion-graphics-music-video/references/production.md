# Sub-agent waves and recoverable production

The coordinator researches, obtains plan approval, owns configuration, assigns jobs, reviews output and assembles the whole song. Workers own distinct run directories. The host agent tool creates sub-agents; Ruby does not start imaginary agent processes.

## Job graph

Write `config/production.json` with `wave: 0` and `jobs`. Example job:

```json
{"id":"hook-frames","run":"s01","resource":"s01","depends":["singer-v1"],"state":"pending","task":"Generate and review approved hook keyframes","deliverables":["output/s01/02_keyframes.jpg"]}
```

Accepted jobs unblock dependencies. Missing IDs, no ready jobs, or a dependency cycle fail explicitly. Split work at meaningful review points: identity → keyframes → character clips → overlay/scene → assembly. Both the opening and main peak should appear in early pilot work. Keep the first two independent assets runnable before any shared-reference dependent jobs.

`work:next` allocates at most 2, then 4, then 8, then 10 jobs (the last limit repeats). `SIZE` permits 3–4 / 4–8 / 6–10 for the later waves. Fewer independent/remaining jobs are valid. Calling again while a wave is active returns the same jobs so an interrupted session resumes. The scheduler gives a run/resource to only one worker in the wave. A Ruby file lock also rejects concurrent `gen:*` calls for one RUN. Do not bypass ownership with ad-hoc library calls.

For each returned job, spawn a worker with:

- Approved PLAN.md and only the relevant reference docs, prompts and identity versions.
- Assigned run, exclusive output paths, exact start/length and dependencies.
- The quality directive, intended joke, character acting and lipsync criteria.
- Ruby commands to execute, maximum new Fal calls, and where to write review evidence.
- Standing authorization for necessary Fal uploads and generation within the approved plan and this worker's budget; do not ask again per scene.
- An explicit instruction to return artifact paths, model request IDs, unresolved defects and a review recommendation; never edit shared config or mark its own work accepted.

Respect actual agent-slot and provider concurrency limits; queue a large wave in smaller concurrent groups. Reference generation dependencies do not disappear merely because more slots are available.

## Scene ownership and monitored logs

Before spawning workers, save an assignment table with worker ID, workspace/RUN, source-song path, fps, inclusive start frame, exclusive end frame, lyric/strophe and reasons for the cut. For example, `[0,242)` and `[242,388)` at 24fps give two contiguous sections ending at 16.167s; 15s would cut the final lyric short. Derive these numbers from the actual song. Require agreement before either worker shifts a shared boundary. Local animation time is `song_time - start_frame / fps`; neither worker may add a fade or pad to change the agreed length.

For a disposable evaluation, initialize projects under a gitignored `work/<evaluation>/` outside the skill. Keep all prompts, media, plans, worker logs and comparison renders there. Only reusable fixes and their tests return to the skill. In a regeneration test, record which identity/song/timing inputs were reused and which scene assets were newly generated; do not pass off an old scene render as regeneration.

Each worker starts a log immediately, then appends on plan/boundary confirmation, model submission/completion (request ID), local render completion, findings, retries and delivery. Log a heartbeat/next action during long waits. Use one file per worker; never include credentials. Through the Ruby CLI:

```sh
LOG_DIR=/absolute/evaluation/logs AGENT=scene-a EVENT=submitted MESSAGE='Opening H3 animation queued; checking in shortly' REQUEST_ID=actual-id ruby scripts/mv.rb --project /absolute/project work:log
LOG_DIR=/absolute/evaluation/logs LIMIT=3 ruby scripts/mv.rb work:watch
```

The coordinator reads these logs after dispatch, during long model/render waits, and before accepting a wave. Record its own review/steering decisions. An unchanged log is a reason to check the agent/process, not proof of failure or permission to submit the same paid request again. Inspect actual returned images and timed motion samples; send concrete corrections (coordinates, occlusions, timing, crop) and review the correction before final assembly.

For the first pilot wave, each production worker generates one representative keyframe, reports its path, and waits for coordinator visual review before expanding paid work. Preparation of local graphics/timing may continue. A user's instruction to regenerate an existing video already authorizes that bounded execution; retain the creative plan and actual request as evidence instead of asking for the same permission again.

## Review and advancement

Inspect the assets and opening/peak playback. A contact sheet alone cannot prove acting or lipsync. Reject a character keyframe before animating it unless it shows one character in one pose, a flat chroma green background with no floor, shadow or spill on the character, the whole silhouette inside the frame with a margin, and a visual style and colour treatment consistent with the approved style bible, including its permitted shading and lighting variation. Reject an H3 clip whose camera moves, whose background changes or that adds props, people or text. Save `docs/reviews/<job>.md` with actual inspected paths, problems and decisions. Run relevant `review:*` tasks and retain their metrics. `JOB=... EVIDENCE=... work:accept` records coordinator acceptance. Failed jobs remain active; fix and review them before advancing. The program requires an evidence file but cannot judge its truthfulness or replace human/agent visual review.

Use `docs/PROGRESS.md` for implementation status. Do not edit the approved PLAN.md just to log progress, since it invalidates approval. A changed character concept/scene direction belongs in a revised plan and user review. Approved routine pose fixes do not.

## Recovery, revisions and cost control

Manifests preserve local paths, URLs, inputs, request IDs and prior attempts. CDN uploads are cached by file bytes so a retry keeps the same model input URLs. `REFRESH_UPLOAD=1` refreshes an expired asset URL and can change the following model request; first resolve any pending request. Queue receipts are saved before polling under `output/requests`; identical inputs resume a receipt. A failure after submitting must first be resumed, not re-submitted. There remains a small ambiguity if the connection drops before the receipt is received; check provider history before retrying that submission.

`FORCE=1` recomputes a step/item; `ONLY=name` limits ItemsStep generation to selected items, including when others are missing. For a genuinely new identical Fal attempt, `NEW_REQUEST=1` explicitly replaces the cached receipt and can incur another charge; use only within the approved allowance. `RECUT=1 ONLY=name FORCE=1 gen:clips` can recut a downloaded clip locally. Changing crop/scale may invalidate the cached plate/overlay; delete only that derived cache through a Ruby service before rendering again.

Identity changes propagate through the dependency graph. Rebuild affected sections, final assembly, SFX and VFX versions. Retain the prior clean and finished video. Stop on exhausted retry/cost allowances and report the specific blocked assets rather than repeatedly generating.

## Finish criteria

All jobs accepted, every storyboard interval covered exactly once, final frame count correct, unbroken original song, clean and VFX renders reviewed, no missing ending, and delivery paths provided. Do not keep increasing the wave size when visual quality declines; repair the cause first.
