// Smoke test for tools/p5/lib/explainer.js with the project fonts (anim:render, 48 frames).
Anim.sketch({
  async load() {
    this.f = await Anim.fonts({ chalk: "chalk.ttf", mono: "mono.ttf", tag: "din-alt.ttf", title: "din-cond.ttf", body: "body.ttf", math: "math-it.otf" });
    this.words = [
      { w: "November", s: 0.1, e: 0.5, speaker: "prof", line: "p01" }, { w: "fourteenth,", s: 0.5, e: 0.9, speaker: "prof", line: "p01" },
      { w: "2022.", s: 0.95, e: 1.6, speaker: "prof", line: "p01" }
    ];
    this.ph = Ex.phrases(this.words);
  },
  draw(t) {
    const f = this.f;
    background(Ex.C.board);
    Ex.grid(0, 0, width, height);
    const cam = Ex.cam(t, [{ t: 0, x: 960, y: 540, z: 1 }, { t: 2, x: 900, y: 500, z: 1.1 }]);
    Ex.withCam(cam, () => {
      Ex.chalk("initial commit", 120, 180, { font: f.chalk, size: 72, progress: t / 1.2 });
      Ex.arrow(140, 230, 520, 330, t / 1.5, { bend: -60 });
      const o = Ex.window(700, 120, 1080, 420, { title: "lib/gpt_prompt.rb", theme: "terminal", font: f.body });
      Ex.code(["class GPT3Prompt", "  MODEL = \"code-davinci-002\"", "  MAX_TOKENS = 600 # app", "  STOP_TOKENS = GPT3_STOP_TOKENS",
        "  temperature: 0.3,"], o.x, o.y, { font: f.mono, size: 30, progress: t / 1.6, highlight: [1], dim: 0.6 });
      Ex.gitlog(t, [{ hash: "63bd846", date: "2022-11-14", msg: "initial commit" }, { hash: "38708c5", date: "2022-11-14", msg: "add templates" },
        { hash: "a250420", date: "2022-11-15", msg: "try different prompts" }], 160, 700, 700, { fonts: { mono: f.mono, body: f.body }, active: 0, reveal: t });
      Ex.math("P(x) = ∏_{t} p(x_{t} | x_{<t})", 150, 520, { font: f.math, size: 60 });
    });
    Ex.card(t, 0.3, 5, 1300, 600, 560, { fonts: { tag: f.tag, title: f.title, body: f.body }, title: "In-context learning",
      body: "No weight updates: the pattern lives only in the prompt, and the model continues it.", cite: "Brown et al., 2020 - arXiv:2005.14165" });
    Ex.stamp(t, 1.2, "NO CHAT YET", 520, 900, { font: f.title, size: 64 });
    Ex.caption(t, this.ph, { font: f.body, size: 34 });
    Ex.vignette(0.4);
  }
});
