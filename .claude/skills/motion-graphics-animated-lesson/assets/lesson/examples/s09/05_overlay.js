// s09 outro (song 167.875–176.875 s, frames 4029–4244; t is section-local; s09c curtain + end card, then s10 credits).
// 2026-09-30: the end card moved to prompts/s09c; after "Stop token!" the scene holds 2 s, then "tadaaa" + an iris to black.
// Plate = s01/hall.
// p15 0.235–1.595 "Class dismissed." (prof) · g02 1.785–4.905 "Description. Write a lecture about..." (GPT-3, no mouth: it
// "speaks" through its screen and printer) · p16 4.465–5.745 "Stop token!" (prof).
//
// Story beat: the stop-token payoff. The s08 board is still up; the class (chalk dev, Claude, Codex) leaves on "dismissed";
// Davinci rolls in and starts printing again — the printout literally continues the lecture prompt; the prof freezes, turns,
// snaps "Stop token!" with a scissor-hand chop; the props-b scissors snip the paper; snap zoom on the prof; HARD CUT to black:
// `HEAD → 63bd846` in mono amber, a commit ribbon (initial commit … +16 commits … HEAD) and the "Sources" end card, held 6.0 s
// (w7-credits) with a bot parade jogging right → left along the bottom (Davinci, Chatty, Claude, Codex, Luca "wait!").
//
// Join: s08 (prompts/s08/05_overlay.js) ends on the neutral hall key (960, 540, z 1.0) with its two-triangle board, the chalk dev
// holding the keyboard and the seated Claude/Codex stills on the chalk ledge. Frame 0 here redraws that end state (same
// constants, runner phases continued with T = t + 11.1667 s of s08 time) so the cut is invisible apart from the prof pose.
//
// Prof: H3 prof_snap (from prof_bow, audio_at 0.13). Measured push-in (halo width + bow-tie area over the cut-out frames):
// ×1.00 → ×1.255 between clip 0 s and 4 s, then flat. DRIFT is divided out about the clip point DC (the head).
// GPT-3: read-only snapshot of s03's gpt3_print frames 16–44 (output/s09/04_clips/gpt3_loop, see its .json). Frames 18–40 are
// locked (eyes and treads measured stable), so they ping-pong as the printing loop; p5 adds screen-eye blinks on g02 words.
const W = 1920, H = 1080;
const BOARD = { x: 237, y: 87, w: 1430, h: 529 };
// ---- s08 end state (copied from prompts/s08/05_overlay.js v2, "Final frame layout" in docs/reviews/s08-full.md) ----
const MID = BOARD.x + BOARD.w / 2;
const LC = { x: 600, y: 300 }, RC = { x: 2 * MID - 600, y: 300 };
const TRI = [[0, -60], [185, 60], [-185, 60]];
const HEAD_Y = BOARD.y + 76, SUBHEAD_Y = BOARD.y + 100;
const NODE = { w: 196, h: 62 };
const DEV = { x: 600, y: 624, h: 216 };
const BOTS = { cl: { x: 1250, y: 622, h: 196 }, cx: { x: 1372, y: 622, h: 188 } };
const KB_H = 74, KB_HOME = [DEV.x + 8, DEV.y - 67];
// s08 section length and its cue times (s08-local s, from output/s08/05_overlay/words.json): by 2.3617, "loop." e 8.3617,
// What 8.4817 → loop done = What + 0.05 + 0.7, keyboard lands at (who − 0.1) + 0.55
const S08 = { len: 11.1667, by: 2.3617, loopE: 8.3617, what: 8.4817, done: 9.2317, arrive: 9.9717 };
// ---- prof_snap placement ----
const PROF = { k: 0.67, ox: -313, oy: 492 };          // world = (ox, oy) + clip px · k  (face ≈ world (357, 760) at frame 0)
const DC = { x: 990, y: 230 };                         // clip-px centre of the measured push-in
const DRIFT = [[0, 1], [1.0, 1.08], [1.33, 1.10], [1.67, 1.12], [2.0, 1.14], [2.33, 1.175], [2.67, 1.195], [3.0, 1.21],
  [3.33, 1.23], [3.67, 1.245], [4.0, 1.255], [6.7, 1.26]];
// ---- GPT-3 (snapshot frame i = s03 frame 16 + i) ----
const GP = { k: 0.45, ax: 900, ay: 925, x: 1500, y: 830, loop: [4, 24] };   // clip px (ax, ay) = tread bottom → world (x, y)
const EYES = [[792, 401, 51, 84], [936, 398, 57, 87]];                    // amber eye rects in clip px (stable in the loop)
const SCREEN_PT = [868, 450];                                             // a dark screen pixel between the eyes (fill colour)
// ---- paper ----
const PAPER = { x0: 1318, y: 858, w: 62, v: 150, t0: 1.62 };              // strip leaves the clip's paper tail at x0, grows left
const PRINT = "Description. Write a lecture about... Implementation. Description. Write a lecture about... Implementation. ";
const CUT_X = 1262;                                                       // snip point on the strip (world)

// ---- end card layout (w7-credits: compacted upward; was hy 230 / ry 392 / sy 520 / pitch 50) ----
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

const lerpTab = (tab, x) => {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) if (x < tab[i][0]) {
    const [a, va] = tab[i - 1], [b, vb] = tab[i];
    return va + ((vb - va) * (x - a)) / (b - a);
  }
  return tab[tab.length - 1][1];
};
const P = (c, i) => [c.x + TRI[i][0], c.y + TRI[i][1]];

Anim.sketch({
  async load() {
    this.f = await Anim.fonts({ chalk: "chalk.ttf", mono: "mono.ttf", tag: "din-alt.ttf", title: "din-cond.ttf", body: "body-med.ttf",
      bodyR: "body.ttf", hand: "hand.ttf", math: "math.otf", monoA: "mono-andale.ttf" });
    const img = (p) => new Promise((ok) => loadImage(p, ok, () => ok(null)));
    this.plate = await img("/output/s01/02_kf_hall.png");
    this.kb = await img("/output/props-a-v1/sprites/keyboard.png");
    this.scissors = await img("/output/props-b-v1/sprites/scissors.png");
    this.curl = await img("/output/props-b-v1/sprites/paper.png");
    // read-only reuse of the accepted s02 stills, cropped exactly as s08 does
    const cl = await img("/output/s02/04_clips/claude_sit/0000.png");
    const cx = await img("/output/s02/04_clips/codex_sit/0000.png");
    this.clSit = cl && cl.get(940, 25, 870, 1450);
    this.cxSit = cx && cx.get(830, 55, 1085, 1415);
    // read-only reuse of s05 dev_type frame 0 (Luca), cropped exactly as s08 does
    const dv = await img("/output/s05/04_clips/dev_type/0000.png");
    this.devSit = dv && dv.get(1050, 170, 790, 1190);
    this.prof = await Anim.clip("prof_snap");
    // bot parade sprites (read-only, run s10)
    this.runners = await Promise.all(PARADE.runners.map(async (r) => {
      const meta = await new Promise((ok) => loadJSON(`/output/s10/04_clips/${r.name}.json`, ok, () => ok(null)));
      if (!meta) return { ...r, frames: [] };
      const frames = await Promise.all(Array.from({ length: meta.frames }, (_, i) => img(`/${meta.dir}/${String(i).padStart(4, "0")}.png`)));
      const ok = frames.filter(Boolean);
      return { ...r, frames: ok, ...this.paradeLoad(meta, ok) };
    }));
    const gmeta = await new Promise((ok) => loadJSON("/output/s09/04_clips/gpt3_loop.json", ok));
    this.gp = await Promise.all(Array.from({ length: gmeta.frames }, (_, i) => img(`/${gmeta.dir}/${String(i).padStart(4, "0")}.png`)));
    const sc = this.gp[10].get(...SCREEN_PT);
    this.screenCol = color(sc[0], sc[1], sc[2]);
    // section words carry no speaker/line: 0–1 prof p15, 2–6 GPT-3 g02, 7–8 prof p16
    this.words = Anim.data("words").map((w, i) => {
      const g = i >= 2 && i <= 6;
      return { ...w, speaker: g ? "gpt3" : "prof", line: g ? "g02" : i < 2 ? "p15" : "p16" };
    });
    this.cue = Anim.cues(this.words);
    // g02 overlaps p16 ("about..." vs "Stop"): a phrase leaves just before the next starts (Ex.caption holds 0.35 s past e)
    this.ph = Ex.phrases(this.words).map((p, i, a) => (a[i + 1] ? { ...p, e: Math.min(p.e, a[i + 1].s - 0.375) } : p));
    const prev = "What changed is who holds the keyboard.".split(" ").map((w) => ({ w, s: -3, e: 10.9217 - 11.1667, speaker: "prof" }));
    this.ph.unshift({ s: -3, e: 10.9217 - 11.1667, words: prev });   // s08 last caption, still in its 0.35 s hold at the join
  },

  // ---------------- s08 end state (mirror of prompts/s08/05_overlay.js v2 at s08 time T = t + 11.1667) ----------------
  node(c, i, label, sub, o = {}) {
    const [x, y] = P(c, i), f = this.f, w = NODE.w, h = NODE.h, col = o.color || Ex.C.chalk;
    const bx = x - w / 2, by = y - h / 2, r = 16;
    Ex.chalkLine([[bx + r, by], [bx + w - r, by], [bx + w, by + r], [bx + w, by + h - r], [bx + w - r, by + h], [bx + r, by + h],
      [bx, by + h - r], [bx, by + r], [bx + r, by]], 99, { color: col, weight: 4, seed: 11 + i + (o.seed || 0) });
    Ex.chalk(label, x, y + 11, { font: f.chalk, size: 28, align: CENTER, progress: 99, color: col, seed: 5 + i });
    push(); noStroke(); fill(243, 239, 228, 170);
    if (o.subMath) { textFont(f.math); textSize(21); } else { textFont(f.mono); textSize(15); }
    if (o.subColor) fill(o.subColor);
    if (i === 0 && o.side) {
      textAlign(o.side === "left" ? RIGHT : LEFT, CENTER);
      text(sub, x + (o.side === "left" ? -1 : 1) * (w / 2 + 12), y + 1);
    } else { textAlign(CENTER, TOP); text(sub, x, y + h / 2 + 9); }
    pop();
  },
  edge(c, i, o = {}) {
    const a = P(c, i), b = P(c, (i + 1) % 3);
    const trim = (from, to, d) => { const L = dist(...from, ...to); return [from[0] + ((to[0] - from[0]) * d) / L, from[1] + ((to[1] - from[1]) * d) / L]; };
    const d0 = i === 0 ? 78 : i === 1 ? 110 : 52, d1 = i === 0 ? 52 : i === 1 ? 110 : 78;
    const s = trim(a, b, d0), e = trim(b, a, d1);
    Ex.arrow(s[0], s[1], e[0], e[1], 99, { bend: i === 1 ? 18 : 22, color: o.color || Ex.C.chalk, weight: 4, head: 16, seed: 21 + i + (o.seed || 0) });
  },
  runner(c, u, col, size) {
    const k = ((u % 1) + 1) % 1, seg = Math.floor(k * 3), f = k * 3 - seg;
    const a = P(c, seg), b = P(c, (seg + 1) % 3);
    push(); noStroke(); drawingContext.shadowColor = col; drawingContext.shadowBlur = 18;
    fill(col); circle(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, size);
    pop();
  },
  // Luca (s05 dev_type cutout, read-only, same crop as s08): leaves on "dismissed" via the puppet exit (T1 in s08 time)
  dev(T, T1) {
    if (!this.devSit) return;
    Ex.puppet(this.devSit, T, { ...DEV, t0: S08.by, t1: T1, from: "pop", bob: 3, speed: 0.8, phase: 0.2, breathe: 0.012, exitDur: 0.35 });
    const a = 1 - Anim.clamp01((T - T1) / 0.3);
    if (a <= 0) return;
    push(); textFont(this.f.hand); textSize(30); textAlign(RIGHT, BASELINE); noStroke();
    fill(243, 239, 228, 210 * a); text("you", DEV.x - 80, DEV.y - 150); pop();
  },
  robots(T, T1) {
    const tIn = S08.what + 0.2, tArrive = S08.arrive;
    const glow = Anim.clamp01((T - tArrive) / 0.2) * (1 - Anim.clamp01((T - tArrive - 0.9) / 0.4));
    const g4 = T < T1 ? glow : 0;
    if (this.cxSit) Ex.puppet(this.cxSit, T, { ...BOTS.cx, t0: tIn + 0.1, t1: T1 + 0.1, from: "pop", bob: 2 + 4 * g4, speed: 0.8, phase: 0.4, breathe: 0.012, exitDur: 0.3 });
    if (this.clSit) Ex.puppet(this.clSit, T, { ...BOTS.cl, t0: tIn, t1: T1, from: "pop", bob: 2 + 4 * g4, speed: 0.8, phase: 0, breathe: 0.012, exitDur: 0.3 });
    if (g4 > 0 && this.clSit) {
      const sx = BOTS.cl.x, sy = BOTS.cl.y - BOTS.cl.h * 0.95;
      const g = drawingContext.createRadialGradient(sx, sy, 3, sx, sy, 66);
      g.addColorStop(0, `rgba(255,214,140,${0.85 * g4})`); g.addColorStop(1, "rgba(255,214,140,0)");
      push(); noStroke(); drawingContext.fillStyle = g; circle(sx, sy, 132); pop();
    }
  },
  // props-a keyboard at rest in Luca's lap (s08's non-flying branch), fading out as he leaves
  keyboard(T, alpha) {
    if (!this.kb || alpha <= 0) return;
    const x = KB_HOME[0], y = KB_HOME[1] + Math.sin(T * 5) * 3, pulse = 0.8 + 0.2 * Math.sin(T * 7);
    push(); drawingContext.globalAlpha *= alpha;
    const g = drawingContext.createRadialGradient(x, y, 6, x, y, 200);
    g.addColorStop(0, `rgba(255,181,61,${0.5 * pulse})`); g.addColorStop(1, "rgba(255,181,61,0)");
    drawingContext.fillStyle = g; noStroke(); ellipse(x, y, 420, 250);
    drawingContext.shadowColor = "rgba(255,170,40,0.95)"; drawingContext.shadowBlur = 34;
    Ex.img(this.kb, x, y, KB_H * alpha, { rot: -0.05 });
    drawingContext.shadowColor = "transparent";
    pop();
  },
  board(t, tDis) {
    const f = this.f, A = Ex.C.amber, T = t + S08.len, T1 = tDis + S08.len;
    Ex.chalkLine([[MID, BOARD.y + 26], [MID, BOARD.y + BOARD.h - 20]], 99, { weight: 3, seed: 2, color: "rgba(243,239,228,0.55)" });
    Ex.chalk("2022 · by hand", LC.x, HEAD_Y, { font: f.chalk, size: 38, align: CENTER, progress: 99 });
    Ex.chalk("2025 · by agent", RC.x, HEAD_Y, { font: f.chalk, size: 38, align: CENTER, color: A, progress: 99 });
    push(); textFont(f.hand); textSize(21); textAlign(CENTER, BASELINE); noStroke();
    fill(243, 239, 228, 170); text("gpt3_generate_app · 14–29 Nov 2022", LC.x, SUBHEAD_Y);
    fill(255, 181, 61, 190); text("Claude Code · Codex", RC.x, SUBHEAD_Y);
    pop();
    this.node(LC, 0, "examples", "few-shot · ∇θ = 0", { subMath: true, side: "left" }); this.edge(LC, 0);
    this.node(LC, 1, "pipeline", "lib/generate_app.rb", {}); this.edge(LC, 1);
    this.node(LC, 2, "fix-error", "prompt_fix_error.md", {}); this.edge(LC, 2);
    this.runner(LC, (T - S08.loopE) * 0.35, Ex.C.chalk, 12);
    this.node(RC, 0, "Think", "reason about the task", { color: A, seed: 40, side: "right" }); this.edge(RC, 0, { color: A, seed: 40 });
    this.node(RC, 1, "Act", "edit · run tests", { color: A, seed: 40 }); this.edge(RC, 1, { color: A, seed: 40 });
    this.node(RC, 2, "Observe", "read the output", { color: A, seed: 40 }); this.edge(RC, 2, { color: A, seed: 40 });
    this.runner(RC, (T - S08.done) * 1.6, A, 12);
    push(); translate(MID, LC.y + 20); noStroke(); fill(Ex.C.ink); circle(0, 0, 84); pop();
    Ex.chalkLine([[MID - 22, LC.y + 10], [MID + 22, LC.y + 10]], 99, { weight: 6, seed: 31, color: A });
    Ex.chalkLine([[MID - 22, LC.y + 30], [MID + 22, LC.y + 30]], 99, { weight: 6, seed: 32, color: A });
    push(); noStroke(); fill(Ex.C.ink); rect(MID - 72, LC.y - 62, 144, 36, 12); pop();
    Ex.chalk("same shape", MID, LC.y - 36, { font: f.hand, size: 26, align: CENTER, progress: 99, color: A });
    // "Class dismissed": the class leaves — Luca (with the keyboard) and Claude/Codex pop out with bursts
    this.dev(T, T1);
    this.robots(T, T1 + 0.08);
    this.keyboard(T, 1 - Anim.clamp01((t - tDis) / 0.3));
    Ex.burst(t, tDis + 0.05, DEV.x, DEV.y - DEV.h * 0.4, { n: 16, color: "rgba(243,239,228,0.8)", dist: 150, size: 10, seed: 3, dur: 0.5 });
    Ex.burst(t, tDis + 0.13, BOTS.cl.x, BOTS.cl.y - 90, { n: 14, color: Ex.C.claude, dist: 120, size: 7, seed: 5, dur: 0.5 });
    Ex.burst(t, tDis + 0.23, BOTS.cx.x, BOTS.cx.y - 90, { n: 14, color: "#5B6CFF", dist: 120, size: 7, seed: 6, dur: 0.5 });
  },

  // ---------------- professor ----------------
  profDraw(t) {
    const im = this.prof.at(t);
    if (!im) return;
    const z = lerpTab(DRIFT, t - this.prof.audio_at);
    const k = PROF.k, ax = PROF.ox + DC.x * k, ay = PROF.oy + DC.y * k, kk = k / z;
    imageMode(CORNER);
    image(im, ax - DC.x * kk, ay - DC.y * kk, im.width * kk, im.height * kk);
  },

  // ---------------- GPT-3 ----------------
  gptFrame(t, tStop) {
    const [a, b] = GP.loop, n = b - a, tt = Math.min(t, tStop);
    const u = Math.floor(tt * 24) % (2 * n);                       // ping-pong a → b → a
    return a + (u < n ? u : 2 * n - u);
  },
  gpt(t, tIn, tStop, blinks) {
    if (t < tIn) return;
    const i = this.gptFrame(t, tStop), im = this.gp[i];
    if (!im) return;
    const roll = Anim.ease.outCubic(Anim.clamp01((t - tIn) / 0.55));
    const dx = 760 * (1 - roll);
    const judder = t < tStop ? Math.sin(t * 38) * 1.6 : 0;          // printer shudder
    const k = GP.k, ox = GP.x - GP.ax * k + dx + judder, oy = GP.y - GP.ay * k;
    // contact shadow on the stage floor
    noStroke(); fill(0, 0, 0, 55); ellipse(GP.x + dx + 40, GP.y + 2, 330, 26);
    imageMode(CORNER); image(im, ox, oy, im.width * k, im.height * k);
    // screen-eye overlays: blinks on g02 words, flat "stopped" dashes after the snip
    const blink = blinks.some((b) => t >= b && t < b + 0.13);
    const stopped = t >= tStop + 0.06;
    if (blink || stopped) {
      for (const [ex, ey, ew, eh] of EYES) {
        const X = ox + ex * k, Y = oy + ey * k, w = ew * k, h = eh * k;
        noStroke(); fill(this.screenCol); rect(X - 4, Y - 4, w + 8, h + 8, 3);
        fill(Ex.C.amber); drawingContext.shadowColor = "rgba(255,181,61,0.8)"; drawingContext.shadowBlur = 8;
        rect(X, Y + h / 2 - (stopped ? 3 : 2), w, stopped ? 6 : 4, 2);
        drawingContext.shadowBlur = 0;
      }
    }
    return { ox, oy, k, dx };
  },

  // Tractor-feed printout: leaves the clip's paper tail and crawls left along the stage lip toward the prof.
  // Characters are printed at the tail in time with g02 and travel with the paper, so the left end reads first.
  paper(t, tCut, tSnipE) {
    if (t < PAPER.t0) return;
    const f = this.f, v = PAPER.v, tt = Math.min(t, tCut);
    const lead = PAPER.x0 - v * (tt - PAPER.t0) - 40;              // left end of the strip
    const fall = t > tCut ? t - tCut : 0;
    const yOf = (x) => PAPER.y + Math.sin(x * 0.03 + tt * 2.2) * 5 * Math.min(1, (PAPER.x0 - x) / 120);
    // cut piece = [lead, CUT_X]; stub = [CUT_X, x0]
    const seg = (x0, x1, dy, rot, alpha) => {
      if (x1 <= x0 || alpha <= 0) return;
      push(); drawingContext.globalAlpha *= alpha;
      translate((x0 + x1) / 2, dy); rotate(rot); translate(-(x0 + x1) / 2, 0);
      const hw = PAPER.w / 2;
      noStroke(); fill(0, 0, 0, 40);
      beginShape(); for (let x = x0; x <= x1; x += 8) vertex(x, yOf(x) + hw + 5); vertex(x1, yOf(x1) + hw + 5); vertex(x1, yOf(x1) + hw - 2);
      for (let x = x1; x >= x0; x -= 8) vertex(x, yOf(x) + hw - 2); endShape(CLOSE);
      fill(Ex.C.paper); stroke(Ex.C.ink); strokeWeight(2.2);
      beginShape();
      for (let x = x0; x <= x1; x += 8) vertex(x, yOf(x) - hw); vertex(x1, yOf(x1) - hw);
      vertex(x1, yOf(x1) + hw); for (let x = x1; x >= x0; x -= 8) vertex(x, yOf(x) + hw);
      endShape(CLOSE);
      noStroke(); fill(Ex.C.ink);                                   // sprocket holes, travelling with the paper
      const ph = (v * tt) % 16;
      for (let x = x0 + ((x1 - ph) % 16 + 16) % 16; x < x1 - 3; x += 16) { circle(x, yOf(x) - hw + 7, 4.2); circle(x, yOf(x) + hw - 7, 4.2); }
      // printed text: char j born at tb(j) at the print head (x0 of the stub side), moving left at v
      textFont(f.monoA); textSize(24); textAlign(LEFT, CENTER); fill(40, 36, 48);
      const cw = textWidth("M"), rate = v / cw, tStart = this.tPrint;
      const nChars = Math.floor((tt - tStart) * rate);
      for (let j = 0; j < Math.min(nChars, PRINT.length); j++) {
        const x = PAPER.x0 - 26 - v * (tt - (tStart + j / rate));
        if (x < x0 + 4 || x > x1 - cw - 2) continue;
        const ch = PRINT[j]; if (ch === " ") continue;
        text(ch, x, yOf(x) + 1);
      }
      pop();
    };
    const drop = fall > 0 ? 0.5 * 2600 * fall * fall : 0;
    // the leading end curls up off the floor (props-b paper curl) while it prints; drawn first so the strip covers its tail
    if (this.curl && fall === 0 && tt - PAPER.t0 > 0.6) {
      const a = Anim.clamp01((tt - PAPER.t0 - 0.6) / 0.4), ch = 70 * a, cw = ch * this.curl.width / this.curl.height;
      Ex.img(this.curl, lead - cw / 2 + 16, yOf(lead) + PAPER.w / 2 - 2, ch, { anchor: "bottom", flip: true, rot: -0.05 + 0.03 * Math.sin(tt * 5) });
    }
    if (fall === 0) seg(lead, PAPER.x0, 0, 0, 1);                  // one piece until the snip: no seam at CUT_X
    else {
      seg(lead, CUT_X, drop, -0.35 * Math.min(1, fall * 3), 1 - Anim.clamp01((fall - 0.25) / 0.3));
      seg(CUT_X + 6, PAPER.x0, 0, 0, 1);
    }
    return lead;
  },

  // props-b scissors, split at the pivot into two halves (upper handle + lower blade | lower handle + upper blade) that close.
  snip(t, t0, tClose, x, y) {
    if (!this.scissors || t < t0) return;
    const im = this.scissors, PV = [403, 303], h = 150, s = h / im.height;
    const fly = Anim.ease.outBack(Anim.clamp01((t - t0) / (tClose - t0 - 0.06)));
    const px = lerp(x - 520, x, fly), py = lerp(y - 460, y - 44, fly);
    const c = Anim.ease.inCubic(Anim.clamp01((t - tClose) / 0.09));   // 0 open → 1 shut
    const open = 1 - c;
    const rot = 1.66 + 0.25 * (1 - fly);                              // blades pointing down onto the strip
    const half = (quads, dir) => {
      push(); translate(px, py); rotate(rot + dir * 0.27 * (1 - open));
      drawingContext.save(); drawingContext.beginPath();
      for (const [qx, qy] of quads) drawingContext.rect(qx < 0 ? -PV[0] * s : 0, qy < 0 ? -PV[1] * s : 0, qx < 0 ? PV[0] * s : (im.width - PV[0]) * s, qy < 0 ? PV[1] * s : (im.height - PV[1]) * s);
      drawingContext.clip();
      imageMode(CORNER); image(im, -PV[0] * s, -PV[1] * s, im.width * s, im.height * s);
      drawingContext.restore(); pop();
    };
    push(); drawingContext.shadowColor = "rgba(0,0,0,0.35)"; drawingContext.shadowBlur = 16; drawingContext.shadowOffsetY = 8;
    half([[1, -1], [-1, 1]], 1);    // upper blade (TR) + lower handle (BL) closes clockwise
    half([[-1, -1], [1, 1]], -1);   // upper handle (TL) + lower blade (BR) closes counter-clockwise
    pop();
    if (t >= tClose + 0.08) {
      Ex.burst(t, tClose + 0.08, x, y, { n: 16, color: Ex.C.paper, dist: 120, size: 8, seed: 12, dur: 0.45 });
      const fl = Anim.clamp01(1 - (t - tClose - 0.08) / 0.2);
      if (fl > 0) { stroke(255, 255, 255, 230 * fl); strokeWeight(5); for (let i = 0; i < 6; i++) { const a = -PI / 2 + (i - 2.5) * 0.45; line(x + Math.cos(a) * 40, y + Math.sin(a) * 40, x + Math.cos(a) * 90, y + Math.sin(a) * 90); } noStroke(); }
    }
  },

  // ---------------- end card (w7-credits: compacted upward to free a parade band at the bottom; held 6.0 s) ----------------
  // endCardDraw(u, dy) and paradeDraw(u, dy) are mirrored verbatim in prompts/s10/05_overlay.js, which scrolls them up (dy < 0)
  // with u = 6.0 + t so the join s09 → s10 is continuous. Keep the two copies in sync.
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

  endCard(t, tCut) {
    const K = width / W, u = t - tCut;
    push(); scale(K);
    background(Ex.C.ink);
    this.endCardDraw(u, 0);
    this.paradeDraw(u, 0);
    pop();
  },

  draw(t) {
    const f = this.f, c = this.cue, K = width / W;
    const tDis = c("dismissed.").s, tDesc = c("Description.").s, tWrite = c("Write").s, tLect = c("lecture").s;
    const tAbout = c("about...").s, tStop = c("Stop").s, tTok = c("token!").s, tTokE = c("token!").e;
    this.tPrint = tDesc - 0.05;
    const tIn = tDesc - 0.35;                 // Davinci rolls in just before it starts "speaking"
    const tClose = tTok;                      // blades shut on "token!"
    const tSnap = tTok + 0.08;                // snap zoom on the prof
    const tCut = 140 / 24;                    // 5.833 s: where the old hard cut to the end card was (p16 ends 5.745)
    const tIris = tTokE + 2.0;                // 2 s pause after "Stop token!", then "tadaaa" + iris to black (2026-09-30)
    const tBlack = tIris + 1.0;
    if (t >= tBlack) { background(0); return; }
    background(Ex.C.ink);
    // hall-wide (neutral key from s08) → drift toward the printout → push to the snip → snap zoom on the prof
    // (keys clamped: |x - 960| <= 960 - 960/z, |y - 540| <= 540 - 540/z)
    const cam = Ex.cam(t, [
      { t: 0, x: 960, y: 540, z: 1.0 },
      { t: tDesc, x: 955, y: 548, z: 1.02, ease: "linear" },
      { t: tAbout, x: 1010, y: 575, z: 1.08, ease: "inOutCubic" },
      { t: tStop + 0.05, x: 1016, y: 578, z: 1.085, ease: "linear" },
      { t: tClose, x: 1110, y: 628, z: 1.2, ease: "outCubic" },
      { t: tSnap, x: 1112, y: 630, z: 1.2, ease: "linear" },
      { t: tSnap + 0.16, x: 520, y: 700, z: 1.85, ease: "outExpo" },
      { t: tCut, x: 530, y: 704, z: 1.9, ease: "linear" },
      { t: tBlack, x: 540, y: 700, z: 1.98, ease: "inOutCubic" }   // the pause: a slow breath of a push while everything holds
    ]);
    const shake = t > tClose + 0.06 && t < tClose + 0.28 ? [Math.sin(t * 110) * 9 * K * (1 - (t - tClose - 0.06) / 0.22), 0] : [0, 0];
    Ex.withCam({ ...cam, z: cam.z * K }, () => {
      if (this.plate) { imageMode(CORNER); image(this.plate, 0, 0, W, H); }
      this.board(t, tDis);
      this.paper(t, tClose + 0.06, tSnap);
      this.gpt(t, tIn, tClose + 0.06, [tDesc, tWrite, tLect, tAbout]);
      this.profDraw(t);
      this.snip(t, tStop + 0.02, tClose, CUT_X, PAPER.y);
      Ex.stamp(t, tClose + 0.1, "STOP", CUT_X + 10, PAPER.y - 150, { font: f.title, size: 70, color: Ex.C.pink, rot: -0.12 });
    }, shake);
    // PhD card during g02 (top-left, over the 2022 half of the board; never over a face)
    Ex.card(t, tDesc + 0.1, tStop - 0.1, 70 * K, 70 * K, 600 * K, { fonts: { tag: f.tag, title: f.title, body: f.bodyR, cite: f.bodyR },
      size: 20 * K, title: "Why Davinci never stops",
      body: "A completion model just keeps sampling p(xₜ | x<ₜ) until max_tokens runs out or it emits a stop sequence. The legacy Completions API took up to 4 stop strings; the Codex paper stopped on '\\nclass', '\\ndef', '\\n#', '\\nif', '\\nprint'.",
      cite: "OpenAI Completions API (legacy) · Chen et al. 2021 · arXiv:2107.03374" });
    // on the snap zoom the caption slides right, off the prof (face/body fill x < ~1100 at z 1.85)
    const capDx = 560 * K * Anim.ease.outCubic(Anim.clamp01((t - tSnap) / 0.16));
    push(); translate(capDx, 0);
    Ex.caption(t, this.ph, { font: f.body, size: 34 * K, y: height - 52 * K, speakers: { prof: "#FFFFFF", gpt3: Ex.C.amber } });
    pop();
    Ex.vignette(0.3 + 0.15 * Anim.clamp01((t - tSnap) / 0.3));
    this.iris(t, tIris, tBlack);
  },

  // "That's all folks" iris: black closes in from outside the frame to a point at the centre (inCubic), thin warm rim
  iris(t, t0, t1) {
    if (t < t0) return;
    const u = Anim.clamp01((t - t0) / (t1 - t0)), R = Math.hypot(width, height) / 2 + 20;
    const r = R * (1 - Anim.ease.inCubic(u));
    push(); noStroke(); fill(0);
    beginShape();
    vertex(-10, -10); vertex(width + 10, -10); vertex(width + 10, height + 10); vertex(-10, height + 10);
    beginContour();
    for (let i = 0; i <= 96; i++) { const a = -TWO_PI * i / 96; vertex(width / 2 + r * Math.cos(a), height / 2 + r * Math.sin(a)); }
    endContour();
    endShape(CLOSE);
    if (r > 2) { noFill(); stroke(255, 181, 61, 90); strokeWeight(3 * width / W); circle(width / 2, height / 2, 2 * r); }
    pop();
  }
});
