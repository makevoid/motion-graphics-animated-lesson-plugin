// Exercises typography, timing and graphics helpers with browser system fonts:
//   ruby scripts/mv.rb 'anim:render[tools/p5/examples/smoke.js,tmp/anim_smoke,48]'
Anim.sketch({
  async load() {
    this.f = { big: "sans-serif", mono: "monospace", serif: "serif", sans: "sans-serif" };
    const w = (word, s, e) => ({ w: word, s, e });
    this.cue = Anim.cues([w("hello", 0.1, 0.5), w("print", 0.5, 0.9), w("world", 0.9, 1.4)]);
  },

  draw(t) {
    const { f, cue } = this;
    textFont(f.big);
    textSize(160);
    textAlign(LEFT, BASELINE);
    Anim.at(120, 260, Anim.pop(t, cue("hello").s), () =>
      Anim.knockout("HELLO", 0, 0, { weight: 18, ghost: { color: "rgba(43,58,122,0.6)" } }));

    Anim.at(1400, 300, Anim.slap(t, 0.4, { rot: -0.04 }), () => {
      Anim.slip(560, 150, { seed: 3, torn: ["right", "bottom"] });
      textFont(f.mono); textSize(26); fill("#e8488f"); noStroke();
      text("arXiv:0000.00000 [cs.CL]", -250, -20);
      textFont(f.serif); textSize(44); fill("#2b3a7a");
      text(Anim.typed("smoke test", Anim.progress(t, 0.5, 0.6)), -250, 40);
    });

    Anim.trace([[0, 700], [300, 700], [380, 620], [600, 620]], Anim.progress(t, 0.2, 0.8, Anim.ease.outCubic));
    const words = ["hello ", "print ", "world"].map((s, i) => ({ text: s.trim(), cue: cue(s.trim()) }));
    Anim.at(700, 900, {}, () => {
      Anim.slip(640, 110, { seed: 5, torn: [] });
      Anim.karaoke(t, words, -290, 16, { font: f.sans, size: 52 });
    });
    Anim.sparkle(1600, 700, 140, Anim.progress(t, 0.9, 0.9));
    Anim.twinkle(1750, 200, 30 * (0.6 + 0.4 * sin(t * 12)), "#e8488f");
    Anim.grain(0.2);
  }
});
