// s08 the recipe (song 156.708–167.875 s, frames 3761–4029; t is section-local). Plate = s01/hall, redrawn inside the camera.
// p14 0.20–10.92 "It's the same recipe this repo wrote by hand in twenty twenty-two: examples, a pipeline, a fix-error loop.
// What changed is who holds the keyboard." (H3 prof_recipe, audio_at 0.00, from prof_smile).
//
// Story beat: the whole chalkboard, split in two. Left = the 2022 recipe this repo hand-wrote (few-shot examples → pipeline →
// fix-error loop), right = the 2025 agent loop (Think → Act → Observe). Both are drawn as THE SAME triangle; on "What changed"
// the right one draws itself (no hand, an amber cursor leads the stroke), a ghost of the left triangle slides across and lands
// exactly on it (the "aha"), then the props-a keyboard floats from the chalk dev's hands to the robots and back.
//
// Join: prompts/s07/05_overlay.js did not exist when this was written, so s08 opens by uncovering an ink wipe (0–0.35 s)
// into the hall. The last frames hold the neutral hall key (960, 540, z 1.0) for s09.
// Plate landmarks (1920×1080 units): board inner rect x237 y87 w1430 h529 (centre x 952), chalk ledge y≈616.
const W = 1920, H = 1080;
const BOARD = { x: 237, y: 87, w: 1430, h: 529 };
const MID = BOARD.x + BOARD.w / 2;                 // 952: the divider between 2022 and 2025
// Layout v2 (coordinator polish): the triangles sit high and flat so the ~1.7× holders can stand on the ledge under them.
const LC = { x: 600, y: 300 }, RC = { x: 2 * MID - 600, y: 300 };   // triangle centres (mirror images about the divider)
const TRI = [[0, -60], [185, 60], [-185, 60]];     // node offsets: top, bottom-right, bottom-left (clockwise loop)
const HEAD_Y = BOARD.y + 76, SUBHEAD_Y = BOARD.y + 100;   // header baselines
const ARC = 90;                                    // keyboard flight arc height (passes under the "=" disc)
const NODE = { w: 196, h: 62 };
const SHIFT = RC.x - LC.x;
// prof_recipe (1928×1076 frames) came back with a strong uncommanded push-in: the hair-halo width grows 527 → 1197 px (×2.27)
// over the clip (measured every 12 frames from the cut-out alpha; see docs/reviews/s08-full.md). The zoom centre is stable at
// about clip px (700, 400) (fit of head top + halo centre; the residual is natural head sway). Each frame is drawn at k / z(t)
// about that centre, so the prof keeps one size in the world. The clip's own bottom edge rises to clip y 400 + 676 / z
// (≈ 698 px, just under the bow tie, by the end), so the prof is a foreground bust whose cut edge always stays below world y 1080.
const PROF = { k: 1.1, x: -478, y: 330 };          // world = (x, y) + k * clip px, in the un-zoomed frame-0 framing
const DC = { x: 700, y: 400 };
const DRIFT = [[0, 1], [0.5, 1.074], [1, 1.131], [1.5, 1.2], [2, 1.27], [2.5, 1.315], [3, 1.383], [3.5, 1.448], [4, 1.514],
  [4.5, 1.573], [5, 1.603], [5.5, 1.668], [6, 1.723], [6.5, 1.791], [7, 1.837], [7.5, 1.896], [8, 1.951], [8.5, 2.02], [9, 2.057],
  [9.5, 2.125], [10, 2.178], [10.5, 2.22], [11, 2.27], [11.5, 2.3]];
const DEV = { x: 600, y: 624, h: 216 };             // Luca on the chalk ledge (s05 dev_type cutout; chalk fallback): feet on y
const BOTS = { cl: { x: 1250, y: 622, h: 196 }, cx: { x: 1372, y: 622, h: 188 } };
const KB_H = 74;                                   // keyboard height in the lap (×1.3 in flight)
const KB_HOME = [DEV.x + 8, DEV.y - 67], KB_AWAY = [(BOTS.cl.x + BOTS.cx.x) / 2, BOTS.cl.y - 74];

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
      bodyR: "body.ttf", hand: "hand.ttf", math: "math.otf" });
    const img = (p) => new Promise((ok) => loadImage(p, ok, () => ok(null)));
    this.plate = await img("/output/s01/02_kf_hall.png");
    this.kb = await img("/output/props-a-v1/sprites/keyboard.png");
    // read-only reuse of the accepted s02 stills (full 2752×1536 frames): crop to the robots' alpha bounds
    const cl = await img("/output/s02/04_clips/claude_sit/0000.png");
    const cx = await img("/output/s02/04_clips/codex_sit/0000.png");
    this.clSit = cl && cl.get(940, 25, 870, 1450);
    this.cxSit = cx && cx.get(830, 55, 1085, 1415);
    // read-only reuse of s05's dev_type still (full 2752×1536 frame), cropped to Luca's alpha bounds; null → chalk silhouette
    const dv = await img("/output/s05/04_clips/dev_type/0000.png");
    this.devSit = dv && dv.get(1050, 170, 790, 1190);
    this.prof = await Anim.clip("prof_recipe");
    this.words = Anim.data("words").map((w) => ({ ...w, speaker: "prof", line: "p14" }));
    this.cue = Anim.cues(this.words);
    this.ph = Ex.phrases(this.words);
  },

  profDraw(t) {
    const im = this.prof.at(t);
    if (!im) return;
    const z = lerpTab(DRIFT, t - (this.prof.audio_at ?? 0));
    const k = PROF.k, ax = PROF.x + DC.x * k, ay = PROF.y + DC.y * k;   // world point that stays put
    const kk = k / z;
    imageMode(CORNER);
    image(im, ax - DC.x * kk, ay - DC.y * kk, im.width * kk, im.height * kk);
  },

  // A chalk node box with a label (write-on) and a small sub-label.
  node(c, i, p, label, sub, o) {
    if (p <= 0) return;
    const [x, y] = P(c, i), f = this.f, w = NODE.w, h = NODE.h, col = o.color || Ex.C.chalk;
    const bx = x - w / 2, by = y - h / 2, r = 16;
    Ex.chalkLine([[bx + r, by], [bx + w - r, by], [bx + w, by + r], [bx + w, by + h - r], [bx + w - r, by + h], [bx + r, by + h],
      [bx, by + h - r], [bx, by + r], [bx + r, by]], p / 0.55, { color: col, weight: 4, seed: 11 + i + (o.seed || 0) });
    Ex.chalk(label, x, y + 11, { font: f.chalk, size: 28, align: CENTER, progress: (p - 0.35) / 0.5, color: col, seed: 5 + i });
    if (sub && p > 0.7) {
      push(); noStroke(); fill(243, 239, 228, 170 * Anim.clamp01((p - 0.7) / 0.3));
      if (o.subMath) { textFont(f.math); textSize(21); } else { textFont(f.mono); textSize(15); }
      if (o.subColor) fill(o.subColor);
      if (i === 0 && o.side) {          // top node: sub-label outboard of the box, clear of both arrows
        textAlign(o.side === "left" ? RIGHT : LEFT, CENTER);
        text(sub, x + (o.side === "left" ? -1 : 1) * (w / 2 + 12), y + 1);
      } else { textAlign(CENTER, TOP); text(sub, x, y + h / 2 + 9); }
      pop();
    }
  },

  // Edge i → i+1 of the triangle, trimmed so arrows start and end at the box borders.
  edge(c, i, p, o = {}) {
    if (p <= 0) return;
    const a = P(c, i), b = P(c, (i + 1) % 3);
    const trim = (from, to, d) => { const L = dist(...from, ...to); return [from[0] + ((to[0] - from[0]) * d) / L, from[1] + ((to[1] - from[1]) * d) / L]; };
    const d0 = i === 0 ? 78 : i === 1 ? 110 : 52, d1 = i === 0 ? 52 : i === 1 ? 110 : 78;
    const s = trim(a, b, d0), e = trim(b, a, d1);
    Ex.arrow(s[0], s[1], e[0], e[1], p, { bend: i === 1 ? 18 : 22, color: o.color || Ex.C.chalk, weight: 4, head: 16, seed: 21 + i + (o.seed || 0) });
  },

  // A token that runs around the loop (u in laps).
  runner(c, u, col, size) {
    const k = ((u % 1) + 1) % 1, seg = Math.floor(k * 3), f = k * 3 - seg;
    const a = P(c, seg), b = P(c, (seg + 1) % 3);
    const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
    push(); noStroke();
    drawingContext.shadowColor = col; drawingContext.shadowBlur = 18;
    fill(col); circle(x, y, size);
    pop();
  },

  // Chalk silhouette of Luca (messy hair + cowlick, headphones round the neck, hoodie), hands forward to hold the keyboard.
  dev(t, t0) {
    if (this.devSit) {                                  // Luca pops onto the ledge in a puff of chalk dust on "by hand"
      Ex.burst(t, t0, DEV.x, DEV.y - DEV.h * 0.4, { n: 18, color: "rgba(243,239,228,0.8)", dist: 170, size: 12, seed: 3 });
      Ex.puppet(this.devSit, t, { ...DEV, t0, from: "pop", bob: 3, speed: 0.8, phase: 0.2, breathe: 0.012 });
      push(); textFont(this.f.hand); textSize(30); textAlign(RIGHT, BASELINE); noStroke();
      fill(243, 239, 228, 210 * Anim.clamp01((t - t0 - 0.3) / 0.3)); text("you", DEV.x - 80, DEV.y - 150); pop();
      return;
    }
    const p = Anim.clamp01((t - t0) / 0.6);
    if (p <= 0) return;
    const { x, y, h } = DEV, s = h / 132, C = Ex.C.chalk;
    const L = (pts, q, seed, w = 4) => Ex.chalkLine(pts.map(([a, b]) => [x + a * s, y + b * s]), q, { weight: w, seed, jitter: 1.2 });
    const hx = 0, hy = -98, R = 30;
    const circ = []; for (let i = 0; i <= 24; i++) { const a = (i / 24) * TWO_PI; circ.push([hx + Math.cos(a) * R, hy + Math.sin(a) * R * 1.05]); }
    L(circ, p / 0.4, 3);
    L([[-33, -104], [-28, -126], [-18, -120], [-10, -136], [0, -124], [10, -138], [18, -122], [28, -128], [33, -104]], (p - 0.25) / 0.3, 4);
    L([[4, -130], [2, -146], [12, -150]], (p - 0.4) / 0.2, 5, 3);    // cowlick
    L([[-26, -62], [-30, -54], [-22, -48]], (p - 0.35) / 0.2, 6, 3); // headphone cups
    L([[26, -62], [30, -54], [22, -48]], (p - 0.35) / 0.2, 7, 3);
    L([[-24, -58], [0, -50], [24, -58]], (p - 0.35) / 0.2, 8, 3);
    L([[-30, -52], [-44, -30], [-46, 0], [46, 0], [44, -30], [30, -52]], (p - 0.3) / 0.45, 9);   // hoodie
    L([[-40, -34], [-22, -18], [-6, -14]], (p - 0.55) / 0.3, 10, 3);  // arms forward
    L([[40, -34], [22, -18], [6, -14]], (p - 0.55) / 0.3, 12, 3);
    if (p > 0.6) {                                                   // face: tired-hopeful eyes + small smile
      push(); noStroke(); fill(C);
      drawingContext.globalAlpha *= Anim.clamp01((p - 0.6) / 0.2);
      circle(x - 10 * s, y - 100 * s, 5 * s); circle(x + 10 * s, y - 100 * s, 5 * s);
      noFill(); stroke(C); strokeWeight(2.5); arc(x, y - 88 * s, 14 * s, 8 * s, 0.2, PI - 0.2);
      pop();
    }
    push(); textFont(this.f.hand); textSize(26); textAlign(RIGHT, BASELINE); noStroke(); fill(243, 239, 228, 200 * Anim.clamp01((p - 0.8) / 0.2));
    text("you", x - 58 * s, y - 60 * s); pop();
  },

  robots(t, tIn, tArrive) {
    const glow = Anim.clamp01((t - tArrive) / 0.2) * (1 - Anim.clamp01((t - tArrive - 0.9) / 0.4));
    if (this.cxSit) Ex.puppet(this.cxSit, t, { ...BOTS.cx, t0: tIn + 0.1, from: "pop", bob: 2 + 4 * glow, speed: 0.8, phase: 0.4, breathe: 0.012 });
    if (this.clSit) Ex.puppet(this.clSit, t, { ...BOTS.cl, t0: tIn, from: "pop", bob: 2 + 4 * glow, speed: 0.8, phase: 0, breathe: 0.012 });
    if (glow > 0 && this.clSit) {       // Claude's antenna star flares when the keyboard lands
      const sx = BOTS.cl.x + 0.0 * BOTS.cl.h, sy = BOTS.cl.y - BOTS.cl.h * 0.95;
      const g = drawingContext.createRadialGradient(sx, sy, 3, sx, sy, 66);
      g.addColorStop(0, `rgba(255,214,140,${0.85 * glow})`); g.addColorStop(1, "rgba(255,214,140,0)");
      push(); noStroke(); drawingContext.fillStyle = g; circle(sx, sy, 132); pop();
    }
  },

  // props-a keyboard: in the dev's hands from "by hand", to the robots on "who holds", back to the dev on "keyboard".
  keyboard(t, tHave, tGo, tBack, dGo = 0.55, dBack = 0.52) {
    if (!this.kb || t < tHave) return;
    const home = KB_HOME, away = KB_AWAY;
    const go = Anim.ease.inOutCubic(Anim.clamp01((t - tGo) / dGo));
    const back = Anim.ease.inOutCubic(Anim.clamp01((t - tBack) / dBack));
    const u = go * (1 - back);                          // 0 = with the dev, 1 = with the robots
    const flying = (go > 0 && go < 1) || (back > 0 && back < 1);
    const path = (uu) => [home[0] + (away[0] - home[0]) * uu, home[1] + (away[1] - home[1]) * uu - ARC * Math.sin(Math.PI * uu)];
    const hover = Math.sin(t * 5) * 3;
    const [x, y0] = path(u), y = y0 + hover;
    const appear = Anim.ease.outBack(Anim.clamp01((t - tHave) / 0.35));
    const h = KB_H * appear * (flying ? 1.3 : 1), rot = (flying ? 0.16 * Math.sin((t - tGo) * 6) : -0.05);
    const pulse = 0.8 + 0.2 * Math.sin(t * 7);
    if (flying) {                                       // faint chalk-amber arc showing the whole route
      push(); noFill(); stroke(255, 181, 61, 70); strokeWeight(3); drawingContext.setLineDash([6, 12]);
      beginShape(); for (let i = 0; i <= 40; i++) vertex(...path(i / 40)); endShape();
      drawingContext.setLineDash([]); pop();
    }
    push();
    const g = drawingContext.createRadialGradient(x, y, 6, x, y, 200);
    g.addColorStop(0, `rgba(255,181,61,${(flying ? 0.62 : 0.5) * pulse})`); g.addColorStop(1, "rgba(255,181,61,0)");
    drawingContext.fillStyle = g; noStroke(); ellipse(x, y, 420, 250);
    drawingContext.shadowColor = "rgba(255,170,40,0.95)"; drawingContext.shadowBlur = 34;
    Ex.img(this.kb, x, y, h, { rot });
    drawingContext.shadowColor = "transparent";
    pop();
    if (flying) for (let i = 0; i < 7; i++) {              // amber sparkle trail
      const lag = (i + 1) * 0.04, uu = Anim.clamp01(u - (back > 0 ? -lag : lag));
      const [tx, ty] = path(uu);
      noStroke(); fill(255, 214, 120, 220 - i * 28); push(); translate(tx, ty); rotate(PI / 4); const s = 14 - i * 1.4; rect(-s / 2, -s / 2, s, s); pop();
    }
  },

  draw(t) {
    const f = this.f, c = this.cue, K = width / W;
    const tSame = c("same").s, tBy = c("by").s, tTw = c("twenty").s, tEx = c("examples,").s, tPipe = c("pipeline,").s;
    const tFix = c("fix-error").s, tLoop = c("loop.").s, tLoopE = c("loop.").e, tWhat = c("What").s, tChanged = c("changed").s;
    const tWho = c("who").s, tHolds = c("holds").s, tKey = c("keyboard.").s, tKeyE = c("keyboard.").e;
    background(Ex.C.ink);
    // left two-thirds of the board with the header in shot from the start → slow push while the 2022 loop builds →
    // 3b1b pull-back to the whole board on "What changed" → neutral hold
    // (keys clamped: |x - 960| <= 960 - 960/z, |y - 540| <= 540 - 540/z)
    const cam = Ex.cam(t, [
      { t: 0, x: 846, y: 566, z: 1.14 },
      { t: tEx - 0.1, x: 826, y: 556, z: 1.20, ease: "inOutCubic" },
      { t: tLoopE, x: 830, y: 558, z: 1.205, ease: "linear" },
      { t: tChanged + 0.55, x: 960, y: 540, z: 1.0, ease: "inOutCubic" },
      { t: 11.2, x: 960, y: 540, z: 1.0, ease: "linear" }
    ]);
    Ex.withCam({ ...cam, z: cam.z * K }, () => {
      if (this.plate) { imageMode(CORNER); image(this.plate, 0, 0, W, H); }
      // divider + headers
      // "2022 · by hand" writes on from "same recipe" (0.5 s), the repo line on "repo", the divider on "hand"
      const tHead = 0.5, tRepo = c("repo").s, tHand = c("hand").s;
      Ex.chalkLine([[MID, BOARD.y + 26], [MID, BOARD.y + BOARD.h - 20]], (t - tHand) / 0.8, { weight: 3, seed: 2, color: "rgba(243,239,228,0.55)" });
      Ex.chalk("2022 · by hand", LC.x, HEAD_Y, { font: f.chalk, size: 38, align: CENTER, progress: (t - tHead) / 1.1 });
      Ex.chalk("2025 · by agent", RC.x, HEAD_Y, { font: f.chalk, size: 38, align: CENTER, color: Ex.C.amber, progress: (t - tWhat) / 0.45 });
      push(); textFont(f.hand); textSize(21); textAlign(CENTER, BASELINE); noStroke();
      fill(243, 239, 228, 170 * Anim.clamp01((t - tRepo) / 0.4)); text("gpt3_generate_app · 14–29 Nov 2022", LC.x, SUBHEAD_Y);
      fill(255, 181, 61, 190 * Anim.clamp01((t - tWhat - 0.3) / 0.4)); text("Claude Code · Codex", RC.x, SUBHEAD_Y);
      pop();
      // 2022: drawn by hand, one node per counted finger, the loop closes on "loop."
      const pl = (t0, d) => (t - t0) / d;
      this.node(LC, 0, pl(tEx, 0.8), "examples", "few-shot · ∇θ = 0", { subMath: true, side: "left" });
      this.edge(LC, 0, pl(tEx + 0.6, tPipe - tEx - 0.6));
      this.node(LC, 1, pl(tPipe, 0.7), "pipeline", "lib/generate_app.rb", {});
      this.edge(LC, 1, pl(tPipe + 0.5, tFix - tPipe - 0.5));
      this.node(LC, 2, pl(tFix, 0.6), "fix-error", "prompt_fix_error.md", {});
      this.edge(LC, 2, pl(tLoop, tLoopE - tLoop));
      if (t > tLoopE) this.runner(LC, (t - tLoopE) * 0.35, Ex.C.chalk, 12);          // one slow, hand-cranked lap
      // 2025: the same triangle draws itself, fast, led by an amber cursor
      const t25 = tWhat + 0.05, A = Ex.C.amber;
      this.node(RC, 0, pl(t25, 0.3), "Think", "reason about the task", { color: A, seed: 40, side: "right" });
      this.edge(RC, 0, pl(t25 + 0.15, 0.15), { color: A, seed: 40 });
      this.node(RC, 1, pl(t25 + 0.2, 0.3), "Act", "edit · run tests", { color: A, seed: 40 });
      this.edge(RC, 1, pl(t25 + 0.35, 0.15), { color: A, seed: 40 });
      this.node(RC, 2, pl(t25 + 0.4, 0.3), "Observe", "read the output", { color: A, seed: 40 });
      this.edge(RC, 2, pl(t25 + 0.55, 0.15), { color: A, seed: 40 });
      const tDone = t25 + 0.7;
      if (t > t25 && t < tDone) {                                                      // the cursor that does the drawing
        const u = (t - t25) / (tDone - t25);
        const k = Math.min(2.999, u * 3), seg = Math.floor(k), fr = k - seg, a = P(RC, seg), b = P(RC, (seg + 1) % 3);
        noStroke(); fill(A); rect(a[0] + (b[0] - a[0]) * fr + 8, a[1] + (b[1] - a[1]) * fr - 12, 11, 22);
      }
      if (t > tDone) this.runner(RC, (t - tDone) * 1.6, A, 12);                       // the agent spins its own loop, fast
      // the "aha": a ghost of the 2022 triangle slides across and lands exactly on the 2025 one
      const tG = tDone - 0.05, gp = Anim.clamp01((t - tG) / 0.45), ge = Anim.ease.inOutCubic(gp);
      const gfade = 1 - Anim.clamp01((t - tG - 0.9) / 0.5);
      if (gp > 0 && gfade > 0) {
        push(); drawingContext.globalAlpha = 0.75 * gfade; noFill(); stroke(243, 239, 228); strokeWeight(3);
        drawingContext.setLineDash([10, 8]);
        const gx = LC.x + SHIFT * ge;
        for (let i = 0; i < 3; i++) { const [x, y] = P({ x: gx, y: LC.y }, i); rect(x - NODE.w / 2 - 6, y - NODE.h / 2 - 6, NODE.w + 12, NODE.h + 12, 18); }
        beginShape(); for (let i = 0; i <= 3; i++) { const [x, y] = P({ x: gx, y: LC.y }, i % 3); vertex(x, y); } endShape();
        drawingContext.setLineDash([]);
        pop();
      }
      if (gp >= 1) Ex.burst(t, tG + 0.45, RC.x, RC.y + 30, { n: 22, color: Ex.C.amber, dist: 230, size: 9, seed: 8, shape: "line" });
      // "=" on the divider + "same shape"
      const tEq = tG + 0.45;
      if (t > tEq) {
        const e = Anim.ease.outBack(Anim.clamp01((t - tEq) / 0.3));
        push(); translate(MID, LC.y + 20); scale(e); noStroke(); fill(Ex.C.ink); circle(0, 0, 84); pop();
        Ex.chalkLine([[MID - 22, LC.y + 10], [MID + 22, LC.y + 10]], (t - tEq) / 0.15, { weight: 6, seed: 31, color: A });
        Ex.chalkLine([[MID - 22, LC.y + 30], [MID + 22, LC.y + 30]], (t - tEq - 0.1) / 0.15, { weight: 6, seed: 32, color: A });
        push(); noStroke(); fill(Ex.C.ink); drawingContext.globalAlpha *= Anim.clamp01((t - tEq - 0.1) / 0.2);
        rect(MID - 72, LC.y - 62, 144, 36, 12); pop();                                   // clears the divider under the words
        Ex.chalk("same shape", MID, LC.y - 36, { font: f.hand, size: 26, align: CENTER, progress: (t - tEq - 0.15) / 0.4, color: A });
      }
      // who holds the keyboard
      this.dev(t, tBy);
      // the keyboard lifts off on "who", lands with the robots on "holds", flies home on "-board"
      const tGo = tWho - 0.1, dGo = 0.55, tBack = tKey + 0.38, dBack = 0.52;
      this.robots(t, tWhat + 0.2, tGo + dGo);
      this.keyboard(t, tBy + 0.55, tGo, tBack, dGo, dBack);
      this.profDraw(t);
    });
    Ex.wipe(t, 0, { dur: 0.7, color: Ex.C.ink, dir: "right" });   // uncovering half of a wipe from the s07 lab
    Ex.card(t, tEx + 0.15, tLoopE, width - 600 * K, 150 * K, 560 * K, { fonts: { tag: f.tag, title: f.title, body: f.bodyR, cite: f.bodyR },
      size: 20 * K, title: "agent = LLM + tools + loop",
      body: "The loop is scaffolding, not new weights: the model proposes an action, a harness runs it, and the observation goes back into the context. In 2022 this repo's Ruby was the harness, written by hand.",
      cite: "Thought → Action → Observation · Yao et al., ReAct (2022) · arXiv:2210.03629" });
    Ex.caption(t, this.ph, { font: f.body, size: 34 * K, y: height - 52 * K, speakers: { prof: "#FFFFFF" } });
    Ex.vignette(0.3);
  }
});
