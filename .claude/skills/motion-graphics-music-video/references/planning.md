# Intake, research and a complete storyboard

Two supported paths come from the original toolkit: P(doom) used reference-video analysis; wife/boyfriend used a song, creative prompt and web research. Neither path requires the previous projects' files or characters.

For a requested regeneration, begin from the established storyboard and latest approved identity versions. Preserve its meaningful scene actions (for example, a sleepless character reclining in bed for “lie awake”) unless the user requested a remix. A polished but different desk pose is not automatically faithful. Check exported character sheets against the current manifest and storyboard: an export can still contain an older design after a later character edit. Use `ref:import` to verify provenance, and deliberately resolve version mismatches before prompting. Record reused references versus newly generated frames/clips in the evaluation report.

## Song-first planning

1. Preserve the original in `audio/source.<extension>`. `audio:analyze` decodes it once to `audio/song.wav`, produces beats/onsets and loudness/energy reports. Listen to confirm section boundaries: the simple beat detector assumes a steady 4/4 grid and is advisory for tempo changes.
2. Make a timeline at 24fps. Section `at` is the inclusive starting frame; `frames` is its length; end is exclusive. Adjacent sections satisfy `next.at = at + frames`. Cover frame zero through `ceil(song_duration * 24)`; the last video frame may outlast audio by less than one frame. Never lose the intro or duplicate an alternative take.
3. Mark exact lyric start/end, singer, face visibility and emotional action. Core lip-sync moments get dedicated close or medium shots. Silence, breaths and instrumental breaks are timing events too.
4. After approval, Whisper word chunks and Demucs vocals can refine the timing. Keep corrections in `docs/TIMING.md` and local words JSON. Do not rewrite an approved creative plan merely to log implementation progress.

## Research for interesting details

Search the song's subject and concrete phrases, then adjacent visual/cultural topics. Collect several useful candidates, not a giant link dump. Each entry has source title, URL, access date, verified fact or inspiration, proposed visual joke, scene ID, and whether it is fictionalized. Use current primary sources for real numbers and claims. Avoid forcing irrelevant memes into every shot.

Build escalating callbacks: introduce a prop in the hook, misuse it in a verse, transform it at the drop, pay it off at the ending. Include small background jokes, scale changes, diagram gags, fake interfaces, match cuts and character reactions. Design readable focal areas and a few calm beats; chaos comes from choreography rather than constant random flicker.

## With a reference video

Use `media:probe`, `media:cuts`, `media:cut`, `media:frames[...,12,480]` and `media:frame` through Ruby. Review dense frame strips between cuts; a sparse contact sheet hides how a character follows a chart or how a camera reveals a scene. Record:

| Frame range | lyric/cue | camera | character action | graphics/action path | foreground/background | reuse/invention |
|---|---|---|---|---|---|---|

Cut detection is a candidate list: flat graphics and hard flashes need visual confirmation. Study staging/motion, then write an original plan in the user's chosen direction.

## Approval package

Use `assets/plan-template.md`. The plan must cover the whole song, contain concrete prompts, and identify which details came from research. Estimate calls by model and generated seconds, allow a bounded number of retries and quote current pricing sources when available. If price cannot be established, say so and obtain a call-count budget. Do not invent a dollar total. The chat summary should let the user understand the video without reading every prompt, while the linked document makes each prompt reviewable.

Approval covers execution within those creative and cost bounds. Ask again for a changed creative plan, an unavailable model that needs substitution, or spending beyond the allowance. Routine failed local renders, recuts and edits within the plan can proceed.
