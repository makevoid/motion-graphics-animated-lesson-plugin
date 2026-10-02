# Motion Graphics Animated Lesson

Version **0.2.0**.

A Claude Code plugin for creating narrated cartoon lessons from a topic, paper, repository or script. It combines character acting with p5 diagrams, code, captions and camera moves, then adds music ducked under dialogue, a theatrical curtain call and animated credits.

The plugin includes its reusable artwork, curtain still images, animation and timing recipes and all five original music beds.

### Samples:

See 10 examples on X: (1-9) https://x.com/makevoid/status/2105673599046598834

10: https://x.com/makevoid/status/2105311203715153972?s=46

## Install and invoke

From a local checkout in Claude Code:

```sh
claude plugin marketplace add makevoid/motion-graphics-animated-lesson-plugin
claude plugin install motion-graphics-animated-lesson@makevoid-animated-lesson
/plugin configure motion-graphics-animated-lesson@makevoid-animated-lesson 
```

Then execute `/plugin configure motion-graphics-animated-lesson@makevoid-animated-lesson` in the same session.

Enter your Fal AI API key and the setup is done!

Now you can proceed on Claude Code TUI or on close the terminal and use the Claude desktop app. 

### Claude Desktop instructions

Open a new Claude Code session, add a folder to it and then execute: 

```
/motion-graphics-animated-lesson
```


<img width="696" height="146" alt="Screenshot 2026-10-02 at 15 14 45" src="https://github.com/user-attachments/assets/abfdb1e6-4e16-4a3c-ae54-f97bf01e3c63" />


The plugin will load and you will be good to go to prompt away!

<img width="742" height="560" alt="Screenshot 2026-10-02 at 15 20 07" src="https://github.com/user-attachments/assets/68a61d3b-78cc-4b09-85bd-a364f5eb9a30" />

You can follow the question that Claude asks one by one or you can just test a prompt such as "create a minecraft viral video on something about computer science, use 480p vertical format, 30s video no intro no outro, make a banger!" (this should cost max 5$ of Fal AI MiniMax H3 credits).

<img width="851" height="584" alt="Screenshot 2026-10-02 at 15 53 37" src="https://github.com/user-attachments/assets/0a7cf6c9-eff0-40b2-8fee-a730e9c66173" />

This example data: Opus 5.5 Medium - 355k Token Used - Fal AI usage: 3 $ - Note it reused the guidelines of the 2 default character contained in the skill, feel free to prompt to override them at the beginning of this process.


Check the `output` directory when claude is finished or just ask claude to show you the video if you are in the Claude desktop app and it didn't show the video to you.

Note - for continuing on Claude Code do the same but on a terminal.

Enjoy!


### License

The toolkit code is MIT licensed. Preserved user-supplied artwork and model outputs retain their original provenance and applicable terms. System fonts selected into a project keep their own licenses.

---

Feel free to contribute to this repo and enjoy using this plugin!

## External services and data sharing

The local MCP server and CLI use these external services:

- **Fal API and storage** (`queue.fal.run`, `rest.alpha.fal.ai`, and provider-returned media URLs): authentication, prompts, narration/lyrics, settings, and selected images/audio/video for generation, transcription, and stem separation. Uploaded media links may be accessible to anyone with the link; the plugin does not automatically delete remote assets.
- **Fal schemas** (`fal.ai/api/openapi/queue/openapi.json`): model identifiers for schema lookup.
- **Web research:** search queries and reference URLs go to Claude's configured search provider and visited sites.
- **Setup and updates:** package requests go to RubyGems, npm, and PyPI (or configured mirrors); plugin installation and updates contact GitHub.

Editing, rendering, mixing, and exports run locally. Project files retain briefs, scripts, media, and generation metadata, including personal data supplied in that content. No maintainer telemetry or automatic social publishing is included. Normal Claude conversation and tool-result handling still applies.
