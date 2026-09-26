// Anim paper: torn-edge paper slips (labels, stickers, caption cards) with a soft drop shadow.
window.Anim = window.Anim || {};

(() => {
  const cache = new Map();

  // Outline of a w×h slip centred on the origin. `torn` lists the ragged edges ("top", "right", "bottom", "left");
  // the rest get a faint cut-paper wobble. Seeded, so the same slip keeps its shape on every frame.
  Anim.slipPath = (w, h, { seed = 1, torn = ["right"], rough = 7, step = 9 } = {}) => {
    const key = [w, h, seed, torn, rough, step].join("|");
    if (cache.has(key)) return cache.get(key);
    const rnd = Anim.rng(seed);
    const pts = [];
    const edge = (name, ax, ay, bx, by, nx, ny) => {
      const len = Math.hypot(bx - ax, by - ay);
      const n = Math.max(2, Math.round(len / step));
      const amp = torn.includes(name) ? rough : 0.9;
      for (let i = 0; i < n; i++) {
        const k = i / n;
        const j = (rnd() - 0.5) * 2 * amp * (torn.includes(name) ? 1 : 0.6);
        pts.push([ax + (bx - ax) * k + nx * j, ay + (by - ay) * k + ny * j]);
      }
    };
    const x0 = -w / 2, y0 = -h / 2, x1 = w / 2, y1 = h / 2;
    edge("top", x0, y0, x1, y0, 0, 1);
    edge("right", x1, y0, x1, y1, -1, 0);
    edge("bottom", x1, y1, x0, y1, 0, -1);
    edge("left", x0, y1, x0, y0, 1, 0);
    cache.set(key, pts);
    return pts;
  };

  // Draw the slip at the current origin. Call inside Anim.at(x, y, transform, () => Anim.slip(...)).
  Anim.slip = (w, h, { fill: f = "#f1ead9", shadow = "rgba(40,30,20,0.28)", blur = 14, offset = [5, 7], ...pathOpts } = {}) => {
    const pts = Anim.slipPath(w, h, pathOpts);
    push();
    drawingContext.shadowColor = shadow;
    drawingContext.shadowBlur = blur;
    drawingContext.shadowOffsetX = offset[0];
    drawingContext.shadowOffsetY = offset[1];
    noStroke();
    fill(f);
    beginShape();
    pts.forEach(([x, y]) => vertex(x, y));
    endShape(CLOSE);
    pop();
  };
})();
