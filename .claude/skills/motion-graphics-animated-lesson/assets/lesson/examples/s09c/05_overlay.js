// s09c curtain call (song 176.875–187.125 s, frames 4245–4490; t is section-local; s10 credits follow). No speech.
// Reusable ending (docs_for_generating_cartoony_animated_lessons/12-ending-curtain-call.md):
//   s09 ends: "Stop token!" → 2 s pause → "tadaaa" + iris to black (prompts/s09/05_overlay.js iris()).
//   here: black → the red curtain (H3 1080P curtain_close, keyed: its open stage is chroma green, so black shows through) sweeps
//   shut → holds → H3 curtain_open reveals the end card (HEAD → 63bd846, commit ribbon, Sources) with the bot parade already
//   starting → the curtain flies out (scale up + fade) → the end card holds to u = 5.958 s on the last frame, where s10 takes
//   over with u = 6.0 + t (U0 in prompts/s10/05_overlay.js), so the join is seamless.
// Curtain clips: output/s09c/04_clips/curtain_{close,open} (run curtain-v1 ref_base = closed, s09c keyframe "open").
const W = 1920, H = 1080;
// clip-time maps: [section t, clip t] pairs, linear between, clamped outside (H3 5 s clips retimed to the beat, no audio)
const CLOSE = [[0.15, 0.4], [2.5, 2.75], [3.6, 4.4]];
const OPEN = [[3.6, 0.5], [6.4, 3.6], [7.0, 4.2]];
const FLY = { t0: 6.1, t1: 6.9 };                 // after the open settles: the drapes fly out (scale 1 → 1.35) and fade
const FADE_IN = { t0: 0.0, t1: 0.3 };             // the drapes appear out of the iris black
const U_START = 4.25;                             // end-card clock u = t - U_START (u = 5.958 on the last frame, 245/24 s)
// ---- end card + parade: mirrored verbatim from prompts/s09/05_overlay.js (keep in sync) ----
const EC = { hy: 150, ry: 318, sy: 408, pitch: 42 };
// ---- bot parade on the end card (w7-credits). Clips: output/s10/04_clips/run_*.json (H3 768P, end_image = image → loop).
// t0 = entry time after the end-card cut (s), v = jog speed (world units/s), hc = drawn figure height, lift = hover height,
// sw = contact-shadow width, ph = loop phase (frames). Mirrored in prompts/s10/05_overlay.js (keep in sync).
const PARADE = {
  ground: 1040, x0: 2140, bob: 3,
  runners: [
    { name: "run_gpt3", t0: 0.30, v: 330, hc: 205, lift: 0, sw: 170, ph: 0 },
    { name: "run_chatty", t0: 1.15, v: 345, hc: 200, lift: 26, sw: 120, ph: 7 },
    { name: "run_claude", t0: 2.00, v: 350, hc: 210, lift: 0, sw: 130, ph: 13 },
    { name: "run_codex", t0: 2.75, v: 362, hc: 215, lift: 0, sw: 120, ph: 19 },
    { name: "run_luca", t0: 3.70, v: 330, hc: 225, lift: 0, sw: 150, ph: 5 }
  ]
};
const lerpMap = (tab, x) => {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) {
    const [a, av] = tab[i - 1], [b, bv] = tab[i];
    return av + ((bv - av) * (x - a)) / (b - a);
  }
  return tab[tab.length - 1][1];
};

Anim.sketch({
  async load() {
    this.f = await Anim.fonts({ mono: "mono.ttf", title: "din-cond.ttf", body: "body-med.ttf", bodyR: "body.ttf", hand: "hand.ttf" });
    const img = (p) => new Promise((ok) => loadImage(p, ok, () => ok(null)));
    this.close = await Anim.clip("curtain_close");
    this.open = await Anim.clip("curtain_open");
    this.runners = await Promise.all(PARADE.runners.map(async (r) => {
      const meta = await new Promise((ok) => loadJSON(`/output/s10/04_clips/${r.name}.json`, ok, () => ok(null)));
      if (!meta) return { ...r, frames: [] };
      const frames = await Promise.all(Array.from({ length: meta.frames }, (_, i) => img(`/${meta.dir}/${String(i).padStart(4, "0")}.png`)));
      const ok = frames.filter(Boolean);
      return { ...r, frames: ok, ...this.paradeLoad(meta, ok) };
    }));
  },

  curtain(c, ct, a = 1, z = 1) {
    const im = c.frame(ct * 24);
    if (!im || a <= 0) return;
    push(); drawingContext.globalAlpha *= a;
    translate(W / 2, H / 2); scale(z); translate(-W / 2, -H / 2);
    c.place(im, 0, 0, W);
    pop();
  },

  draw(t) {
    const K = width / W;
    push(); scale(K);
    background(t < OPEN[0][0] ? 0 : Ex.C.ink);
    if (t >= OPEN[0][0]) {                         // behind the opening curtain: the end card + parade
      const u = Math.max(0, t - U_START);
      this.endCardDraw(u, 0);
      this.paradeDraw(u, 0);
    }
    if (t < OPEN[0][0]) {
      const a = Anim.ease.outCubic(Anim.clamp01((t - FADE_IN.t0) / (FADE_IN.t1 - FADE_IN.t0)));
      this.curtain(this.close, lerpMap(CLOSE, t), a);
    } else {
      const fly = Anim.clamp01((t - FLY.t0) / (FLY.t1 - FLY.t0));
      this.curtain(this.open, lerpMap(OPEN, t), 1 - Anim.ease.inCubic(fly), 1 + 0.35 * Anim.ease.inCubic(fly));
    }
    pop();
  },

  // ---------------- end card + bot parade (verbatim copy of prompts/s10/05_overlay.js; keep in sync) ----------------
  endCardDraw(u, dy) {
    const f = this.f;
    push(); translate(0, dy); noStroke();
    // HEAD → 63bd846 (hard cut: already there), block cursor blinking
    textFont(f.mono); textSize(92); textAlign(LEFT, BASELINE);
    const head = "HEAD → 63bd846", hw = Ex.tw(head), hx = W / 2 - hw / 2 - 20, hy = EC.hy;
    drawingContext.shadowColor = "rgba(255,181,61,0.55)"; drawingContext.shadowBlur = 26;
    fill(Ex.C.amber); Ex.text(head, hx, hy);
    drawingContext.shadowBlur = 0;
    if (Math.floor(u * 2.4) % 2 === 0) rect(hx + hw + 16, hy - 70, 44, 80);
    const ctext = (str, x, y) => Ex.text(str, x - Ex.tw(str) / 2, y);
    textSize(24); fill(108, 122, 137); textAlign(LEFT, BASELINE);
    ctext("$ git checkout 63bd846   # class dismissed: back to where it began", W / 2, hy + 48);
    // commit ribbon: initial commit … +16 commits … HEAD, with HEAD's pointer looping back to the first commit
    const rx0 = 360, rx1 = 1560, ry = EC.ry, rev = Anim.ease.outCubic(Anim.clamp01(u / 0.35));
    stroke(243, 239, 228, 110); strokeWeight(4); line(rx0, ry, rx0 + (rx1 - rx0) * rev, ry);
    noStroke();
    for (let i = 1; i <= 16; i++) {                                  // the 16 later commits as small ticks (unlabelled)
      const x = rx0 + ((rx1 - rx0) * i) / 17; if (x > rx0 + (rx1 - rx0) * rev) break;
      fill(243, 239, 228, 120); circle(x, ry, 9);
    }
    const node = (x, lab, sub, on) => {
      noStroke(); if (on) { fill(255, 181, 61, 60); circle(x, ry, 50); }
      fill(on ? Ex.C.amber : Ex.C.chalk); circle(x, ry, 22);
      textAlign(LEFT, TOP); textFont(f.mono); textSize(22); fill(on ? Ex.C.amber : Ex.C.chalk); ctext(lab, x, ry + 24);
      textFont(f.bodyR); textSize(18); fill(243, 239, 228, 150); ctext(sub, x, ry + 54);
    };
    node(rx0, "63bd846", "2022-11-14 · initial commit", true);
    if (rev > 0.98) node(rx1, "HEAD", "2022-11-29", false);
    textAlign(LEFT, BOTTOM); textFont(f.mono); textSize(20); fill(243, 239, 228, 170);
    ctext("… +16 commits …", (rx0 + rx1) / 2, ry - 16);
    // pointer arc HEAD → 63bd846
    const ap = Anim.clamp01((u - 0.2) / 0.4);
    if (ap > 0) {
      noFill(); stroke(Ex.C.amber); strokeWeight(3.5);
      const pts = []; for (let i = 0; i <= 40; i++) { const v = i / 40; pts.push([rx1 + (rx0 - rx1) * v, ry - 30 - Math.sin(v * PI) * 70]); }
      const nn = Math.max(2, Math.floor(pts.length * ap));
      beginShape(); for (let i = 0; i < nn; i++) vertex(...pts[i]); endShape();
      if (ap >= 1) { const [ex, ey] = pts[40]; line(ex, ey, ex + 16, ey - 12); line(ex, ey, ex + 4, ey - 19); }
      noStroke();
    }
    // Sources (row pitch 50 → 42 to make room for the parade band)
    const sy = EC.sy, sx = 300;
    textAlign(LEFT, TOP); textFont(f.title); textSize(44); fill(Ex.C.amber); text("SOURCES", sx, sy);
    fill(Ex.C.amber); rect(sx, sy + 50, 120, 4);
    const src = [
      ["github.com/makevoid/gpt3_generate_app", " — the exhibit: 17 commits, 2022-11-14 → 2022-11-29"],
      ["Brown et al. 2020", " — Language Models are Few-Shot Learners (GPT-3) · arXiv:2005.14165"],
      ["Chen et al. 2021", " — Evaluating LLMs Trained on Code (Codex, HumanEval, pass@k) · arXiv:2107.03374"],
      ["Ouyang et al. 2022", " — Training LMs to follow instructions with human feedback (InstructGPT) · arXiv:2203.02155"],
      ["Yao et al. 2022", " — ReAct: Synergizing Reasoning and Acting in Language Models · arXiv:2210.03629"],
      ["Jimenez et al. 2023", " — SWE-bench: Can LMs Resolve Real-World GitHub Issues? · arXiv:2310.06770 · swebench.com"],
      ["Anthropic 2025 · OpenAI 2025", " — Claude 3.7 Sonnet & Claude Code; Claude 4 · Codex (codex-1) announcements"]
    ];
    src.forEach(([a, b], i) => {
      const y = sy + 70 + i * EC.pitch, e = Anim.clamp01((u - 0.05 - i * 0.03) / 0.2);
      push(); drawingContext.globalAlpha *= e; translate((1 - e) * 24, 0);
      textFont(f.body); textSize(27); fill(Ex.C.chalk); const w = Ex.text(a, sx, y);
      textFont(f.bodyR); textSize(25); fill(243, 239, 228, 175); Ex.text(b, sx + w, y + 1);
      pop();
    });
    // signature moved from the bottom-right corner (now the parade band) to the top-right corner
    textFont(f.hand); textSize(24); fill(243, 239, 228, 140); textAlign(LEFT, TOP);
    const sig = "Software Archaeology 101 · Prof. Otto Regress"; Ex.text(sig, W - 60 - Ex.tw(sig), 30);
    pop();
  },

  // Bot parade: H3 768P in-place run loops (run s10, keyed), entering from the right one after the other at a relaxed jog.
  // H3 let the runners wander inside their frames, so every frame is re-anchored on its own alpha: the (smoothed) centroid x
  // follows the runner's x and the lowest opaque pixel sits on the ground line; the scale comes from the median figure height.
  paradeLoad(meta, frames) {
    const an = frames.map((im) => {
      im.loadPixels();
      const w = im.width, h = im.height, p = im.pixels;
      let top = h, bottom = -1, sx = 0, n = 0;
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
        if (p[(y * w + x) * 4 + 3] > 140) { if (y < top) top = y; if (y > bottom) bottom = y; sx += x; n++; }
      }
      return { top, bottom, cx: n ? sx / n : w / 2 };
    });
    const N = an.length - 1, R = 5;                                    // circular smoothing (frame N ≈ frame 0)
    const sm = an.map((_, i) => {
      let cx = 0, bt = 0;
      for (let k = -R; k <= R; k++) { const a = an[(((i + k) % N) + N) % N]; cx += a.cx; bt += a.bottom; }
      return { cx: cx / (2 * R + 1), bottom: bt / (2 * R + 1), top: an[i].top };
    });
    const hs = an.map((a) => a.bottom - a.top).sort((x, y) => x - y);
    return { an: sm, fh: hs[Math.floor(hs.length / 2)] };
  },
  paradeDraw(u, dy) {
    const G = PARADE.ground + dy;
    // faint dotted chalk track, fading in as the first runner arrives
    const ta = Anim.clamp01((u - 0.1) / 0.5);
    if (ta > 0) { noStroke(); fill(243, 239, 228, 34 * ta); for (let x = 20; x < W; x += 22) rect(x, G + 6, 10, 2, 1); }
    for (let k = PARADE.runners.length - 1; k >= 0; k--) {           // back runners first: the leaders overlap their chasers
      const r = this.runners && this.runners[k];
      if (!r || !r.frames.length || u < r.t0) continue;
      const x = PARADE.x0 - r.v * (u - r.t0);
      const n = r.frames.length - 1;                                  // last frame ≈ first (end_image = image): loop over n
      const i = ((Math.floor((u - r.t0) * 24 + r.ph) % n) + n) % n;
      const im = r.frames[i], a = r.an[i];
      if (!im) continue;
      const s = r.hc / r.fh, w = im.width * s, h = im.height * s;
      const ox = x - a.cx * s;
      if (ox > W + 40 || ox + w < -40) continue;
      const bob = Math.abs(Math.sin((u - r.t0) * Math.PI * 2.1 + r.ph)) * PARADE.bob;
      // soft contact shadow (a floating runner casts a smaller, fainter one)
      push(); noStroke(); fill(0, 0, 0, r.lift ? 80 : 125);
      drawingContext.filter = "blur(6px)"; ellipse(x, G + 4, r.sw * (r.lift ? 0.7 : 1), 16); drawingContext.filter = "none";
      pop();
      const oy = G - r.lift - a.bottom * s - bob;
      imageMode(CORNER); image(im, ox, oy, w, h);
      if (r.name === "run_luca") this.waitBubble(u - r.t0, x, oy + a.top * s);
    }
  },
  // the developer's (makevoid, lowercase) silent "wait!" (hand-lettered bubble just ahead of his head, below the Sources, popping on at 0.9 s and nudging with his stride)
  waitBubble(ul, x, yTop) {
    const a = Anim.ease.outBack(Anim.clamp01((ul - 0.9) / 0.25));
    if (a <= 0) return;
    push(); translate(x - 150, yTop + 58 + Math.sin(ul * 9) * 3); scale(a); rotate(-0.06);
    Ex.bubble(-64, -58, 128, 52, { fill: Ex.C.chalk, tail: "right", r: 18 });
    noStroke(); fill(Ex.C.ink); textFont(this.f.hand); textSize(34); textAlign(CENTER, CENTER); text("wait!", 0, -34);
    pop();
  },
});
