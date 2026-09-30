# Research, script and measured scene timing

Start with a teachable question and an artifact or worked example. Record audience, prerequisite knowledge, learning outcome, approximate duration and production budget in `docs/BRIEF.md`. Research precise details and save source title, URL/file, date, verified claim, proposed visual use and scene in `docs/RESEARCH.md`. Fictional classroom jokes are separate from factual claims. Never invent quotes, dates, commit hashes or benchmark numbers.

Write narration turns before rendering. The default arc is a concrete cold open (≤15 s), host/title, several concept/demo scenes, a complication or fast montage, synthesis, and a callback joke. Set up a prop or misunderstanding early and pay it off at the ending. Change setting when the idea changes, while keeping diagrams consistent. Silence and reactions help the viewer absorb the explanation. Dense cards need time; about 150 spoken words/minute is a starting estimate, not a speed requirement.

Use `assets/plan-template.md` for the full script, cast selection/omissions, voices, prompts, scene intentions and budget. The professor and developer are role-dependent defaults. Supplied replacements and voice changes override them. A lesson about botany need not gain a programmer or robot cast. No song attachment is required.

Generate/review TTS after authorization; convert the approximate storyboard into measured frame ranges from `audio/lines.json` and `audio/words.json`. Write those in `docs/TIMING.md`, keeping routine timing refinement outside the hashed plan. Sections at 24fps use `[start, end)` and `frames = end - start`; next.start equals previous.end. Cover frame zero through `ceil(master_duration * 24)`, including reserved tail. Cut in pauses after completed concepts. In a sketch, `local_seconds = master_seconds - start_frame / 24`.

The lesson uses a narration master plus per-speaker stems. Demucs is unnecessary for generated dialogue; existing narration can use verified word timings or authorized transcription. Do not apply a steady 4/4 beat grid to speech. Song beat/energy tools remain available for optional music accents.

When a reference video is supplied, use `media:probe`, `media:cuts`, `media:frames[...,12,480]` and `media:frame` through Ruby. Inspect camera and character movement between cuts as well as overview frames. Record source frame range, spoken cue, camera, acting, graphics, layer order and what to reuse. The bundled case study illustrates craft; its claims are not new-lesson content.

Make the production plan reviewable before requesting missing authorization. Estimate current costs or bounded call counts, generated clip seconds and retries; source-session costs are historical only. Existing authorization covers necessary uploads, production and repairs within scope. Resolve changes outside that scope separately. A new generation must resume an existing queued request before paying for an identical retry.
