// Anim riso: print-look finishing so vector graphics sit in a risograph / screen-print plate.
window.Anim = window.Anim || {};

(() => {
  // Misregistered two-ink print: draws fn(ghostColor) offset by (dx, dy), then fn(color) on top.
  // fn receives the ink colour to use, e.g. (ink) => Anim.knockout("NERVOUS", 0, 0, { fill: ink }).
  Anim.misregister = (fn, { color, ghost = "rgba(43,58,122,0.55)", dx = 4, dy = 3 } = {}) => {
    push();
    translate(dx, dy);
    fn(ghost);
    pop();
    fn(color);
  };

  // Ink grain over everything drawn so far: knocks random speckles out of the alpha channel so fills look
  // printed instead of flat. `amount` 0..1 is the share of alpha removed at most; new pattern every frame.
  Anim.grain = (amount = 0.18, { cell = 2 } = {}) => {
    loadPixels();
    const W = width, H = height, px = pixels;
    const rnd = Anim.rng(9000 + ANIM.frame);
    for (let y = 0; y < H; y += cell) {
      for (let x = 0; x < W; x += cell) {
        const k = 1 - amount * rnd() * rnd() * 2;
        for (let yy = y; yy < Math.min(y + cell, H); yy++) {
          for (let xx = x; xx < Math.min(x + cell, W); xx++) {
            const i = (yy * W + xx) * 4 + 3;
            if (px[i]) px[i] = px[i] * k;
          }
        }
      }
    }
    updatePixels();
  };
})();
