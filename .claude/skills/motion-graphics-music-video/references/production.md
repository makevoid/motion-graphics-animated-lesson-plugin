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
- An explicit instruction to return artifact paths, model request IDs, unresolved defects and a review recommendation; never edit shared config or mark its own work accepted.

Respect actual agent-slot and provider concurrency limits; queue a large wave in smaller concurrent groups. Reference generation dependencies do not disappear merely because more slots are available.

## Review and advancement

Inspect the assets and opening/peak playback. A contact sheet alone cannot prove acting or lipsync. Save `docs/reviews/<job>.md` with actual inspected paths, problems and decisions. Run relevant `review:*` tasks and retain their metrics. `JOB=... EVIDENCE=... work:accept` records coordinator acceptance. Failed jobs remain active; fix and review them before advancing. The program requires an evidence file but cannot judge its truthfulness or replace human/agent visual review.

Use `docs/PROGRESS.md` for implementation status. Do not edit the approved PLAN.md just to log progress, since it invalidates approval. A changed character concept/scene direction belongs in a revised plan and user review. Approved routine pose fixes do not.

## Recovery, revisions and cost control

Manifests preserve local paths, URLs, inputs, request IDs and prior attempts. CDN uploads are cached by file bytes so a retry keeps the same model input URLs. `REFRESH_UPLOAD=1` refreshes an expired asset URL and can change the following model request; first resolve any pending request. Queue receipts are saved before polling under `output/requests`; identical inputs resume a receipt. A failure after submitting must first be resumed, not re-submitted. There remains a small ambiguity if the connection drops before the receipt is received; check provider history before retrying that submission.

`FORCE=1` recomputes a step/item; `ONLY=name` limits ItemsStep generation to selected items, including when others are missing. For a genuinely new identical Fal attempt, `NEW_REQUEST=1` explicitly replaces the cached receipt and can incur another charge; use only within the approved allowance. `RECUT=1 ONLY=name FORCE=1 gen:clips` can recut a downloaded clip locally. Changing crop/scale may invalidate the cached plate/overlay; delete only that derived cache through a Ruby service before rendering again.

Identity changes propagate through the dependency graph. Rebuild affected sections, final assembly, SFX and VFX versions. Retain the prior clean and finished video. Stop on exhausted retry/cost allowances and report the specific blocked assets rather than repeatedly generating.

## Finish criteria

All jobs accepted, every storyboard interval covered exactly once, final frame count correct, unbroken original song, clean and VFX renders reviewed, no missing ending, and delivery paths provided. Do not keep increasing the wave size when visual quality declines; repair the cause first.
