# What the reference lesson teaches about production

Studied source: `video-session14/aicodegen`, its thirteen production-guide chapters, character prompts, source sketches, timing/config and final-frame examples. Final deliverable verified by ffprobe: **5283 frames, 220.125 s, 24fps, 1920×1080**. Earlier source notes call it 217 s; that predates the rewind insertion. The portable artifacts here remove the need for that original directory.

The viewed contact sheet shows a warm classroom with a large board and professor staged at the lower edge; code/few-shot cards appear on the board; diagram scenes dive into the mechanism; a developer desk and later lab establish changes of context; a split-board synthesis returns to the classroom. Separate character cutouts allow the same world, exact text and diagrams to stay stable. Generated whole-scene video would make these precise exhibits harder to revise.

The source uses a terminal/date mystery first, then title/host, prompt examples, a mechanical pipeline/repair loop, developer demo, increasingly frantic copy/paste montage, agent lab, synthesis, stop-token gag and theatrical ending. The joke and keyboard prop recur with new meaning. New lessons should reuse that setup/payoff method, not the software-history content.

Animation techniques worth preserving:

- Exact word cues drive gestures, diagrams and caption highlighting; all scenes share one narration master.
- H3 isolated acting is combined with p5 camera, board text, code windows and concept cards. Whole-body H3 keyframes need margins, and unwanted zoom requires measured inverse-scale compensation.
- The source professor grew roughly 1.46× over one 14 s take despite a locked-camera prompt. Measure the current take rather than copying that curve.
- Independent gears rotate about measured pivots, with ratios derived from actual teeth. One picture of a gear cluster cannot depict a real mechanism.
- Side-view parade loops animate in place; per-frame alpha bounds anchor feet/centres while p5 controls travel.
- p5 text advance uses `fontWidth()`, fixing collapsed code punctuation. Cards/credits need readable holds; motion should not compete with explanation.
- A two-second silent pause makes the final joke land; iris, folding curtain and upbeat titles music give the lesson a theatrical finish.

Original scene frame ranges (inclusive start/exclusive end), useful only for studying the bundled sketches:

| Scene | Frames | Function |
|---|---|---|
| s01 | 0–342 | cold open |
| s02 | 342–752 | title/host |
| s03 | 752–1521 | few-shot explanation |
| s04 | 1521–2183 | mechanism/repair loop |
| s05 | 2183–2671 | developer desk |
| s06 | 2671–3291 | escalating montage |
| s07 | 3291–3761 | agent lab |
| s08 | 3761–4029 | synthesis |
| s09 | 4029–4245 | joke, pause, iris |
| s09c | 4245–4491 | curtain/end card |
| s09t | 4491–4563 | rewind |
| s10 | 4563–5283 | animated credits/final callback |

Preserved study material lives in `assets/lesson/examples/`, the [cast catalogue](cast-and-assets.md), and [ending template](../assets/templates/ending/TEMPLATE.md). Samples are source code for adaptation, not standalone new-project templates. `assets/starter/` contains the actual portable initializer templates.
