// s09t "git checkout 63bd846" — the 3 s bridge from the curtain call to the credits (song 187.125–190.125 s, frames 4491–4562;
// t is section-local). No speech. Reusable recipe: docs_for_generating_cartoony_animated_lessons/13-rewind-transition.md.
//   0.00  s09c's end card + parade continue (end-card clock u = 6.0 + t), slow push-in
//   0.30  ⏎ — the "$ git checkout 63bd846" line on the card executes (amber key flash); a glowing playhead runs the card's
//         arc from HEAD back to 63bd846
//   0.55  VHS glitch-in → ◀◀ REW: b-roll = the lesson itself played backwards (1 fps stills of output/clean.mp4, 185 s → 2 s,
//         inOutCubic so the curtain and the cold open read), with strip jitter, chroma ghost, a rolling tracking band,
//         head-switching noise, scanlines, a VCR OSD, a tape counter and HEAD~n · date running back to the first commit
//   2.30  tape stops on the cold open ("$ git log", commit 63bd846) → ▶ PLAY, "HEAD is now at 63bd846 initial commit"
//   2.62  push into the frame + warm flash (0.92 on the last frame) — s10 opens on the title card under the decaying flash
// B-roll stills: output/s09t/broll/f_NNN.png (media:frames[output/clean.mp4,output/s09t/broll,1,960]; f_NNN = song s NNN−1).
// SFX: key_clack 0.30, vhs_glitch 0.52, vhs_rewind 0.60, tape_clunk 2.30, whoosh 2.70 (prompts/finish-sfx/sfx.yml);
// music: the titles bed tape-stops at 0.55 and restarts from its top under the flash (prompts/finish-music/music.yml).
const W = 1920, H = 1080;
const U0 = 6.0;                                   // end-card clock at frame 0 (s09c ends at u = 5.958)
const T = { enter: 0.30, arc0: 0.30, arc1: 0.62, glitch0: 0.45, glitch1: 0.70, rew0: 0.62, rew1: 2.30, play: 2.40, land: 2.62, end: 71 / 24 };
const REW = { from: 185, to: 2, first: 1, last: 217 };   // song seconds shown during the rewind (still index = s + 1)
const COMMITS = 17;
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

Anim.sketch({
  async load() {
    this.f = await Anim.fonts({ mono: "mono.ttf", title: "din-cond.ttf", body: "body-med.ttf", bodyR: "body.ttf", hand: "hand.ttf" });
    const img = (p) => new Promise((ok) => loadImage(p, ok, () => ok(null)));
    this.runners = await Promise.all(PARADE.runners.map(async (r) => {
      const meta = await new Promise((ok) => loadJSON(`/output/s10/04_clips/${r.name}.json`, ok, () => ok(null)));
      if (!meta) return { ...r, frames: [] };
      const frames = await Promise.all(Array.from({ length: meta.frames }, (_, i) => img(`/${meta.dir}/${String(i).padStart(4, "0")}.png`)));
      const ok = frames.filter(Boolean);
      return { ...r, frames: ok, ...this.paradeLoad(meta, ok) };
    }));
    // only the b-roll stills the rewind actually shows
    const need = new Set();
    for (let i = 0; i < 72; i++) if (i / 24 >= T.rew0) need.add(this.stillIndex(i / 24));
    this.stills = {};
    await Promise.all([...need].map(async (k) => { this.stills[k] = await img(`/output/s09t/broll/f_${String(k).padStart(3, "0")}.png`); }));
  },

  // ---------------- timing helpers ----------------
  rewSec(t) {                                        // song second on the tape at section time t
    const p = Anim.ease.inOutCubic(Anim.clamp01((t - T.rew0) / (T.rew1 - T.rew0)));
    return REW.from + (REW.to - REW.from) * p;
  },
  stillIndex(t) { return Math.max(REW.first, Math.min(REW.last, Math.round(this.rewSec(t)) + 1)); },
  vhsAmt(t) {                                        // 0 = clean picture … 1 = full rewind distortion
    if (t < T.glitch0) return 0;
    if (t < T.glitch1) { const a = Anim.clamp01((t - T.glitch0) / (T.glitch1 - T.glitch0)); return a * (0.7 + 0.3 * Math.abs(Math.sin(t * 90))); }
    if (t < T.rew1) return 1;
    if (t < T.land) return 0.4;
    return 0.3;
  },

  draw(t) {
    const K = width / W, v = this.vhsAmt(t);
    push(); scale(K);
    background(Ex.C.ink);
    if (t < T.rew0) {                                // the end card, live: ⏎, the playhead runs the arc, slow push-in
      const z = 1 + 0.03 * Anim.ease.inOutCubic(Anim.clamp01(t / T.rew0));
      push(); translate(W / 2, 420); scale(z); translate(-W / 2, -420);
      this.endCardDraw(U0 + t, 0); this.paradeDraw(U0 + t, 0);
      this.enterKey(t); this.arcRun(t);
      pop();
      if (v > 0) { const snap = get(); background(Ex.C.ink); this.vhs(snap, t, v); }
    } else {                                         // the lesson rewinding (b-roll), then PLAY, then the push into the flash
      const im = this.stills[this.stillIndex(t)];
      const z = t > T.land ? 1 + 0.25 * Anim.ease.inCubic(Anim.clamp01((t - T.land) / (T.end - T.land))) : 1;
      push(); translate(700, 820); scale(z); translate(-700, -820);
      if (im) this.vhs(im, t, v);
      pop();
    }
    this.scanlines(v);
    this.osd(t);
    this.flash(t);
    pop();
  },

  // ---------------- end-card beats ----------------
  enterKey(t) {                                      // the checkout line executes: amber key flash + a ⏎ keycap
    const k = t - T.enter;
    if (k < 0) return;
    const a = 1 - Anim.clamp01(k / 0.45), y = EC.hy + 48;
    push(); noStroke();
    drawingContext.globalCompositeOperation = "lighter";
    fill(255, 181, 61, 90 * a); rect(470, y - 34, 980, 48, 8);
    drawingContext.globalCompositeOperation = "source-over";
    const pop_ = Anim.ease.outBack(Anim.clamp01(k / 0.18)), cx = 1485, cy = y - 10;
    translate(cx, cy + 6 * Anim.clamp01(k / 0.08) * (1 - Anim.clamp01((k - 0.08) / 0.1))); scale(pop_);
    fill(243, 239, 228, 230); rect(-30, -26, 60, 52, 9);
    fill(Ex.C.ink); textFont(this.f.mono); textSize(34); textAlign(CENTER, CENTER); text("⏎", 0, 0);
    pop();
  },
  arcRun(t) {                                        // a glowing playhead travels the card's arc HEAD → 63bd846
    if (t < T.arc0) return;
    const rx0 = 360, rx1 = 1560, ry = EC.ry;
    const at = (q) => [rx1 + (rx0 - rx1) * q, ry - 30 - Math.sin(q * PI) * 70];
    const p = Anim.ease.inOutCubic(Anim.clamp01((t - T.arc0) / (T.arc1 - T.arc0)));
    push(); noStroke();
    for (let k = 12; k >= 0; k--) {
      const q = Math.max(0, p - k * 0.025), [x, y] = at(q), a = 1 - k / 13;
      fill(255, 181, 61, 150 * a); circle(x, y, 16 * a + 4);
    }
    const [x, y] = at(p);
    fill(255, 181, 61, 70); circle(x, y, 54); fill(255, 236, 190); circle(x, y, 18);
    const q = (t - T.arc1) / 0.3;                     // arrival: a ring bursts off the 63bd846 dot
    if (q > 0 && q < 1) { noFill(); stroke(255, 181, 61, 255 * (1 - q)); strokeWeight(5 * (1 - q) + 1); circle(rx0, ry, 22 + 110 * Anim.ease.outCubic(q)); }
    pop();
  },

  // ---------------- VHS ----------------
  vhs(img, t, v) {                                   // strip jitter + rolling tracking band + head-switching skew + chroma ghost
    const ctx = drawingContext, el = img.canvas || img.elt, iw = img.width, ih = img.height;
    const n = 54, sh = H / n, fr = Math.floor(t * 24);
    const band = H + 120 - ((t * 760) % (H + 360)), bh = 30 + 80 * v;
    const roll = v * Math.sin(t * 37) * 6;
    for (let i = 0; i < n; i++) {
      const y = i * sh, d = Math.abs(y + sh / 2 - band);
      let dx = v * (noise(i * 0.35, fr * 0.7) - 0.5) * 34;
      if (d < bh) dx += v * (noise(i * 2.1, fr * 3.3) - 0.5) * 240 * (1 - d / bh);
      if (y > H - 60) dx += v * 70 * ((y - (H - 60)) / 60);
      ctx.drawImage(el, 0, (y / H) * ih, iw, (sh / H) * ih + 1, dx, y + roll, W, sh + 1);
    }
    if (v <= 0.05) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.2 * v; ctx.drawImage(el, 0, 0, iw, ih, 12 * v, roll, W, H);
    ctx.globalAlpha = 0.12 * v; ctx.drawImage(el, 0, 0, iw, ih, -10 * v, roll, W, H);
    ctx.restore();
    randomSeed(fr * 7 + 1); noStroke();
    fill(255, 22 * v); rect(0, band - bh, W, 2 * bh);
    for (let k = 0; k < Math.round(170 * v); k++) { fill(255, random(80, 220)); rect(random(-40, W), band + random(-bh, bh), random(4, 70), random(1, 3)); }
    fill(0, 150 * v); rect(0, H - 22, W, 22);
    for (let k = 0; k < Math.round(70 * v); k++) { fill(255, random(60, 190)); rect(random(-40, W), H - random(3, 20), random(8, 90), 2); }
  },
  scanlines(v) {
    if (v <= 0) return;
    const s = 0.35 + 0.65 * v;
    noStroke(); fill(0, 62 * s);
    for (let y = 0; y < H; y += 4) rect(0, y, W, 2);
    fill(20, 40, 90, 26 * s); rect(0, 0, W, H);
  },
  osd(t) {                                           // VCR on-screen display: mode, SP, tape counter, git reflog line
    if (t < T.glitch0 + 0.04) return;
    const f = this.f, s = t < T.rew0 ? REW.from : t < T.play ? this.rewSec(t) : REW.to + (t - T.play);
    push(); noStroke(); textFont(f.mono); textAlign(LEFT, BASELINE);
    const ctx = drawingContext;
    ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4; ctx.shadowBlur = 0;
    fill(236, 248, 240); textSize(58);
    const mode = t < T.rew1 ? "◀◀ REW" : t < T.play ? "■ STOP" : "▶ PLAY";
    if (t >= T.rew1 || t < T.glitch1 || Math.floor(t * 3.2) % 2 === 0) text(mode, 96, 128);
    textAlign(RIGHT, BASELINE); text("SP", W - 96, 128);
    const mm = Math.floor(s / 60), ss = Math.floor(s % 60), ff = Math.floor((s % 1) * 24);
    textSize(40); text(`0:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}:${String(ff).padStart(2, "0")}`, W - 96, 196);
    textAlign(LEFT, BASELINE); textSize(36);
    if (t < T.play) {
      const back = 1 - Anim.clamp01((s - REW.to) / (REW.from - REW.to)), n = Math.round((COMMITS - 1) * back);
      const day = 29 - Math.round(15 * back);
      text(`${n === 0 ? "HEAD  " : n === COMMITS - 1 ? "63bd846" : "HEAD~" + n}  ·  2022-11-${day}`, 96, 196);
    } else {
      const str = "HEAD is now at 63bd846 initial commit", nc = Math.min(str.length, Math.floor((t - T.play) * 90));
      fill(255, 196, 92); text(str.slice(0, nc), 96, 196);
    }
    pop();
  },
  flash(t) {
    let a = 0;
    if (t >= T.glitch0 && t < T.glitch0 + 0.09) a = 0.35;               // the glitch pop
    if (t >= T.rew1 && t < T.rew1 + 0.05) a = 0.25;                     // the tape stop
    if (t > T.land) a = 0.92 * Anim.ease.inCubic(Anim.clamp01((t - T.land) / (T.end - T.land)));
    if (a <= 0) return;
    noStroke(); fill(255, 244, 225, 255 * a); rect(0, 0, W, H);
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
