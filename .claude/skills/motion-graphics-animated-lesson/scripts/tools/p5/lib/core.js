// Anim core: owns the p5 lifecycle so a sketch only describes what to draw at time t.
//
//   Anim.sketch({
//     async load() { this.f = await Anim.fonts({ big: "title.ttf" }) },
//     draw(t, frame) { ... }        // canvas is already cleared (transparent) for every frame
//   });
//
// ANIM (set by anim/render.mjs) holds width, height, fps, frames, data (from --data name=file.json).
window.Anim = window.Anim || {};

(() => {
  let current = null;

  Anim.sketch = (def) => { current = def; };

  window.setup = async () => {
    try {
      createCanvas(ANIM.width, ANIM.height);
      pixelDensity(1);
      noLoop();
      if (!current) throw new Error("the sketch never called Anim.sketch({ draw })");
      await current.load?.call(current);
      ANIM.ready = true;
    } catch (e) {
      ANIM.error = e.stack || String(e);
      throw e;
    }
  };

  window.draw = () => {
    if (!ANIM.ready) return;
    clear();
    randomSeed(1000 + ANIM.frame); // per-frame jitter that is identical on every render
    noiseSeed(7);
    current.draw.call(current, ANIM.t, ANIM.frame);
  };

  // Called by render.mjs: draw frame i and return it as a PNG data URL (alpha preserved).
  Anim.renderFrame = async (i) => {
    ANIM.frame = i;
    ANIM.t = i / ANIM.fps;
    await redraw();
    return document.querySelector("canvas").toDataURL("image/png");
  };

  // { name: "File.ttf" } -> { name: p5.Font }, copied into this project's tools/p5/fonts/.
  Anim.fonts = async (map) => {
    const out = {};
    for (const [name, file] of Object.entries(map)) out[name] = await loadFont(`/tools/p5/fonts/${encodeURIComponent(file)}`);
    return out;
  };

  Anim.data = (name) => {
    const d = ANIM.data[name];
    if (d === undefined) throw new Error(`missing --data ${name}=file.json`);
    return d;
  };

  // Character sprite cut out by the Clips step (Anim.data("clips")[name] = { dir, frames, w, h, audio_at }), every frame loaded:
  //   const run = await Anim.clip("flower_run");  run.frame(i) -> p5.Image (clamped, or looped with { loop: true }).
  //   run.at(t) -> the frame lip-synced to song time t (clips with audio_at); run.draw(i, x, y, h) draws it centred at x, y, h tall.
  //   run.place(img, x, y, w) draws it where the character sat in its source frame, that frame drawn w wide with its top-left at (x, y):
  //   sprites of one framing cut from different sources (an H3 clip and a still) then line up exactly.
  Anim.clip = async (name) => {
    const meta = Anim.data("clips")[name];
    if (!meta) throw new Error(`no clip "${name}" (${Object.keys(Anim.data("clips")).join(", ")})`);
    const images = await Promise.all(
      Array.from({ length: meta.frames }, (_, i) => loadImage(`/${meta.dir}/${String(i).padStart(4, "0")}.png`)));
    const frame = (i, { loop = false } = {}) => {
      const n = images.length;
      return images[loop ? ((Math.floor(i) % n) + n) % n : Math.min(n - 1, Math.max(0, Math.floor(i)))];
    };
    return {
      ...meta, images, frame,
      at: (t, opts) => frame((t - (meta.audio_at ?? 0)) * ANIM.fps, opts),
      draw: (img, x, y, h) => { imageMode(CENTER); image(img, x, y, (h * img.width) / img.height, h); },
      place: (img, x = 0, y = 0, w = ANIM.width) => {
        const k = w / meta.src[0], [bx, by, bw, bh] = meta.box;
        imageMode(CORNER);
        image(img, x + bx * k, y + by * k, bw * k, bh * k);
      }
    };
  };

  // Word cues from a transcript: [{ w: "sparks", s: 1.02, e: 1.4 }, ...] (Overlay step writes words.json).
  // cue("your", 2) -> the 2nd "your". Throws with the transcript when a word is missing so timing never silently drifts.
  Anim.cues = (words) => {
    const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
    const list = words.map((x) => ({ ...x, w: norm(x.w) }));
    const cue = (word, nth = 1) => {
      const hits = list.filter((x) => x.w === norm(word));
      if (!hits[nth - 1]) throw new Error(`cue "${word}" #${nth} not in transcript: ${list.map((x) => x.w).join(" ")}`);
      return hits[nth - 1];
    };
    cue.list = list;
    return cue;
  };

  // Seeded PRNG (mulberry32) for shapes that must stay identical across frames (torn edges, trace jitter).
  Anim.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Run fn inside push/pop, translated/rotated/scaled around (x, y); alpha 0..1 multiplies canvas alpha.
  Anim.at = (x, y, { scale: s = 1, rot = 0, alpha = 1 } = {}, fn) => {
    if (alpha <= 0) return;
    push();
    translate(x, y);
    if (rot) rotate(rot);
    if (s !== 1) scale(s);
    const prev = drawingContext.globalAlpha;
    drawingContext.globalAlpha = prev * alpha;
    fn();
    drawingContext.globalAlpha = prev;
    pop();
  };
})();
