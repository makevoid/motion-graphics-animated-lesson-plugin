// Reusable light layer: the post-processing effects that are drawn light rather than image processing: light leaks, a lens flare,
// sparkle glints. Rendered only on the frames where a light cue is live (rake vfx:*), then screen-blended over the finished video by
// vfx/ (mvfx --lights), so black / transparent adds nothing and colours only brighten, like real light on film.
//
// Anim.data("vfx") is the resolved cue list (the project VFX cues.yml -> cues.json); frame numbers are the whole
// song's 24fps grid, so frame i here is frame i of the preview. The envelope matches Cue.env in vfx/Sources/mvfx/Cues.swift.
//
//   leak    span  amt 0.6, color #ff7a2f, x 1 (side it drifts in from: 0 left, 1 right), fade 8
//   flare   hit   amt 1, x/y (0..1 from top-left), color #ffe2c4
//   glints  hit   amt 1, x/y centre, radius 0.14 (of the width), seed, n 12, size 1; sustain: true = one steady glint on x/y that
//                 pops in, shimmers and is gone by the cue's end (mv2: the sticker corner on the last frame)

const INK = { orange: "#ff7a2f", pink: "#ff5fae", mustard: "#ffc24a", cream: "#fff3dc", white: "#ffffff" };
const W = 1928, H = 1076;

const env = (c, frame, shape = "hit", curve = 2.2) => {
  const pre = c.pre || 0;
  if (frame < c.f - pre || frame >= c.f + c.dur) return 0;
  if (frame < c.f) { const q = (frame - (c.f - pre) + 1) / (pre + 1); return q * q; }
  const t = frame - c.f;
  if ((c.shape || shape) === "span") {
    const fd = Math.max(c.fade ?? 8, 1);
    return Math.min(1, (t + 1) / fd, (c.dur - t) / fd);
  }
  return Math.pow(1 - t / Math.max(c.dur, 1), curve);
};

// rgba() of a hex colour at alpha a.
const rgba = (hex, a) => {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${Math.max(0, Math.min(1, a)).toFixed(4)})`;
};

// Soft radial blob of light (canvas gradient, additive).
const blob = (x, y, r, hex, a, { sx = 1, sy = 1 } = {}) => {
  if (a <= 0.002 || r <= 0) return;
  const g = drawingContext;
  g.save();
  g.translate(x, y);
  g.scale(sx, sy);
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, r);
  grad.addColorStop(0, rgba(hex, a));
  grad.addColorStop(0.45, rgba(hex, a * 0.45));
  grad.addColorStop(1, rgba(hex, 0));
  g.fillStyle = grad;
  g.fillRect(-r, -r, 2 * r, 2 * r);
  g.restore();
};

const FX = {
  // Film light leak: warm blobs drifting in from one side, breathing slowly; a second tint and a faint vertical burn streak.
  leak(c, frame) {
    const e = env(c, frame, "span") * (c.amt ?? 0.6);
    if (e <= 0) return;
    const age = (frame - c.f) / 24;
    const side = c.x ?? 1;
    const dir = side > 0.5 ? -1 : 1;
    const x0 = side * W;
    const main = c.color || INK.orange;
    const breathe = 0.85 + 0.15 * Math.sin(age * 2.1 + c.f);
    blob(x0 + dir * (120 + age * 90), H * (0.35 + 0.08 * Math.sin(age * 0.9)), H * 0.95, main, 0.75 * e * breathe, { sx: 0.8, sy: 1.25 });
    blob(x0 + dir * (40 + age * 60), H * 0.85, H * 0.6, INK.pink, 0.45 * e, { sx: 1.2, sy: 0.8 });
    blob(x0 + dir * (260 + age * 140), H * 0.15, H * 0.45, INK.mustard, 0.35 * e * (1.1 - breathe * 0.3));
    blob(x0 + dir * (30 + age * 40), H * 0.5, H * 0.9, INK.cream, 0.3 * e, { sx: 0.12, sy: 1.1 });
  },

  // Lens flare on a bright point: hot core, a long anamorphic streak, a slow four-ray star, ghosts mirrored through the centre.
  flare(c, frame) {
    const e = env(c, frame, "hit", 1.6) * (c.amt ?? 1);
    if (e <= 0) return;
    const age = Math.max(0, frame - c.f);
    const x = (c.x ?? 0.5) * W, y = (c.y ?? 0.5) * H;
    const col = c.color || "#ffe2c4";
    const grow = 1 + 0.25 * Anim.ease.outCubic(Math.min(1, age / 8));
    blob(x, y, 150 * grow, col, 0.9 * e);
    blob(x, y, 45 * grow, INK.white, 1.0 * e);
    blob(x, y, W * 0.48 * grow, INK.cream, 0.55 * e, { sx: 1, sy: 0.018 });       // anamorphic streak
    blob(x, y, W * 0.3 * grow, INK.pink, 0.35 * e, { sx: 1, sy: 0.05 });
    push();                                                                        // four long rays, turning slowly
    translate(x, y);
    rotate(0.35 + age * 0.02);
    for (let i = 0; i < 4; i++) {
      rotate(HALF_PI);
      blob(0, 0, 320 * grow, INK.white, 0.5 * e, { sx: 1, sy: 0.03 });
    }
    pop();
    const cx = W / 2, cy = H / 2;                                                  // ghosts along the line through the centre
    [[-0.35, 38, INK.mustard], [-0.8, 70, INK.pink], [-1.25, 26, INK.cream], [0.45, 20, INK.orange]].forEach(([k, r, h]) => {
      blob(cx + (cx - x) * -k, cy + (cy - y) * -k, r * grow, h, 0.35 * e);
    });
  },

  // A burst of four-point twinkles around a spot, each popping in on its own frame and shrinking out.
  // n (12) twinkles, size (1) scales them. sustain: true makes one steady glint instead: the first twinkle sits exactly on x/y,
  // all of them pop in over 3 frames, shimmer, and shrink out over the cue's last frames, gone by its end (to end on a last frame).
  glints(c, frame) {
    const e = (c.amt ?? 1);
    if (frame < c.f || frame >= c.f + c.dur) return;
    const rnd = Anim.rng(c.seed ?? c.f);
    const x = (c.x ?? 0.5) * W, y = (c.y ?? 0.5) * H, R = (c.radius ?? 0.14) * W;
    const n = c.n ?? 12, k = c.size ?? 1;
    for (let i = 0; i < n; i++) {
      const a = rnd() * TWO_PI, d = c.sustain && i === 0 ? 0 : Math.sqrt(rnd()) * R;
      const start = Math.floor(rnd() * c.dur * 0.55), life = 6 + Math.floor(rnd() * 8);
      const size = (26 + rnd() * 44) * k;
      const pick = [INK.white, INK.cream, INK.pink, INK.mustard][Math.floor(rnd() * 4)];
      const col = c.sustain && i === 0 ? INK.white : pick;
      let s;
      if (c.sustain) {
        const age = frame - c.f;
        const env = Math.min(1, (age + 1) / 3) * Math.pow(Math.max(0, Math.min(1, (c.dur - age) / 5)), 2);
        s = size * (i === 0 ? 1 : 0.45) * env * (0.85 + 0.15 * Math.sin(age * 1.7 + i * 2)) * e;
      } else {
        const p = (frame - c.f - start) / life;
        if (p < 0 || p >= 1) continue;
        s = size * Math.sin(Math.PI * p) * e;
      }
      if (s <= 0) continue;
      const gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d * 0.7;
      blob(gx, gy, s * 2.6, col, 0.6 * e);
      Anim.twinkle(gx, gy, s, col);
    }
  }
};

Anim.sketch({
  load() {
    this.cues = Anim.data("vfx").cues.filter((c) => FX[c.fx]);
  },
  draw(t, frame) {
    push(); scale(width / W, height / H);
    drawingContext.globalCompositeOperation = "lighter";
    for (const c of this.cues) FX[c.fx](c, frame);
    drawingContext.globalCompositeOperation = "source-over";
    pop();
  }
});
