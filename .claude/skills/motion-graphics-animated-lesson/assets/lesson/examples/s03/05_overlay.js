// s03 meet Davinci (song 31.333–63.375 s, frames 752–1521; t is section-local). Plate = s01/hall, redrawn inside the camera.
// p05 0.59–9.91 prof intro (H3 prof_intro audio_at 0.3, then H3 prof_intro_b audio_at 5.2 from the pause after "Codex.")
// · p06 10.41–21.11 few-shot cards on the board · g01 21.46–22.65 GPT-3 "Implementation." (H3 gpt3_print, audio_at 19.5)
// · p07 23.1–31.59 stop token snip, then the recorded parameters (temperature 0.3, max_tokens 600, stop).
//
// H3 push-in compensation (as in s01/s02): every clip frame is drawn at k = s / z(t) about a measured anchor (ax, ay) pinned at a
// world point, where z(t) is the push-in measured from the cut-out frames (prof: hair-halo width; GPT-3: monitor width through the
// eye row, anchor = eye centroid). prof_intro drifts 1 → 1.86 by 5.5 s; prof_intro_b 1 → 1.43; gpt3_print 1 → 1.26.
const W = 1920, H = 1080;
const BOARD = { x: 237, y: 87, w: 1430, h: 529 };
const PROF = { x: 360, y: 680, s: 1.1 };   // pointer tip stays left of the seated Claude
const PA = { ax: 758, ay: 432 }, PB = { ax: 760, ay: 425 };
const ZOOM_A = [[0, 1], [0.25, 1.165], [0.5, 1.512], [0.75, 1.649], [1, 1.694], [1.25, 1.702], [1.5, 1.711], [1.75, 1.719], [2, 1.727],
  [2.25, 1.769], [2.5, 1.773], [2.75, 1.777], [3, 1.789], [3.25, 1.798], [3.5, 1.798], [3.75, 1.802], [4, 1.818], [4.5, 1.831],
  [5, 1.847], [5.5, 1.86]];
const ZOOM_B = [[0, 1], [0.25, 1.033], [0.5, 1.062], [0.75, 1.083], [1, 1.103], [1.25, 1.132], [1.5, 1.161], [1.75, 1.178], [2, 1.194],
  [2.25, 1.219], [2.5, 1.244], [2.75, 1.264], [3, 1.285], [3.25, 1.298], [3.5, 1.322], [3.75, 1.343], [4, 1.343], [4.25, 1.355],
  [4.5, 1.38], [4.75, 1.405], [5, 1.426], [5.12, 1.434]];
const T_AB = 5.25, T_OUT = 10.25;           // A → B cut (hidden under a camera snap), prof exits before the board zoom
// GPT-3: clip frames are 1928×1076 (the still is the same framing at 2752×1536); anchor = eye centroid in clip px.
const GP = { x: 1650, y: 652, s: 0.465 };
const GZOOM = [[0, 1], [1.75, 1.0], [2.0, 1.025], [2.25, 1.104], [2.5, 1.146], [2.75, 1.166], [3, 1.175], [3.5, 1.182], [4, 1.188],
  [4.5, 1.195], [5, 1.203], [5.5, 1.212], [6, 1.22], [6.5, 1.235], [7, 1.243], [7.5, 1.25], [8, 1.257]];
const GANCH = [[0, 921, 370], [0.5, 921, 367], [0.75, 955, 377], [1.75, 954, 380], [2.25, 995, 368], [2.5, 996, 371], [3, 994, 383],
  [3.5, 994, 382], [4, 972, 408], [5, 972, 402], [5.75, 973, 404], [6.25, 956, 400], [8, 957, 398]];
const G_AT = 19.5, SLOT = [935, 636];       // printer slot in clip px
// s02 end state (seated robots behind the front desks)
const SEAT = { cl: { x: 1120, y: 1045, h: 345 }, cx: { x: 1350, y: 1045, h: 345 * 0.85 } };
const DESK_Y = 968, S02_LEN = 410 / 24;
// board cards (p06)
const ROWS = [150, 310, 470], CH = 140, DESC = { x: 380, w: 320 }, IMPL = { x: 770, w: 350 };
const DECK = { x: 470, y: 632 };
// word times (section-local, from output/s03/05_overlay/words.json)
const T = {
  meet: 0.57, code: 0.89, davinci: 1.29, zero: 2.01, two: 2.73, twoE: 3.45, orig: 3.89, codex: 4.25, codexE: 5.13, it1: 5.37,
  chat: 6.05, doesnt2: 6.81, instr: 7.29, it3: 8.49, cont: 8.77, text: 9.53, textE: 10.09, so: 10.4, example: 11.76, exampleE: 12.4,
  d1: 12.96, i1: 13.92, d2: 15.28, i2: 16.24, then: 17.68, d3: 18.72, d3E: 19.68, empty: 20.24, slot: 20.64, impl: 21.44, implE: 22.88,
  stop: 23.19, cuts: 23.91, invents: 25.19, ex2E: 26.63, temp: 27.27, zero2: 28.07, three: 28.71, threeE: 29.51, six: 29.59,
  tokensE: 30.95, max: 31.03, end: 32.04
};
const T_SNIP = T.cuts, T_FILL = 22.3, T_WIPE1 = 10.35, T_WIPE2 = 26.45;

const lerpTab = (tab, x, col = 1) => {
  if (x <= tab[0][0]) return tab[0][col];
  for (let i = 1; i < tab.length; i++) if (x < tab[i][0]) {
    const a = tab[i - 1], b = tab[i];
    return a[col] + ((b[col] - a[col]) * (x - a[0])) / (b[0] - a[0]);
  }
  return tab[tab.length - 1][col];
};
const outBounce = (x) => {
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
};
const bez = (P, u) => {
  const a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c = 3 * (1 - u) * u * u, d = u ** 3;
  return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]];
};

Anim.sketch({
  async load() {
    this.f = await Anim.fonts({ chalk: "chalk.ttf", mono: "mono.ttf", tag: "din-alt.ttf", title: "din-cond.ttf", body: "body-med.ttf",
      bodyR: "body.ttf", math: "math.otf", hand: "hand.ttf" });
    const img = (p) => new Promise((ok) => loadImage(p, ok, () => ok(null)));
    this.plate = await img("/output/s01/02_kf_hall.png");
    const sp = "/output/props-b-v1/sprites/";
    this.sStop = await img(sp + "stopsign.png");
    this.sScis = await img(sp + "scissors.png");
    this.sCards = await img(sp + "cards.png");
    this.sBeret = await img(sp + "beret.png");
    this.clSit = await img("/output/s02/04_clips/claude_sit/0000.png");
    this.cxSit = await img("/output/s02/04_clips/codex_sit/0000.png");
    this.pA = await Anim.clip("prof_intro");
    this.pB = await Anim.clip("prof_intro_b");
    this.gClip = await Anim.clip("gpt3_print");
    this.gStill = (await Anim.clip("gpt3_still")).frame(0);
    // section words carry no speaker/line: g01 "Implementation." (21.44) is GPT-3's
    const lineOf = (s) => (s < 10.3 ? "p05" : s < 21.3 ? "p06" : s < 23.0 ? "g01" : "p07");
    this.words = Anim.data("words").map((w) => ({ ...w, line: lineOf(w.s), speaker: lineOf(w.s) === "g01" ? "gpt3" : "prof" }));
    this.ph = Ex.phrases(this.words).map((p, i, a) => (a[i + 1] ? { ...p, e: Math.min(p.e, a[i + 1].s - 0.45) } : p));
  },

  // ---------- characters ----------
  prof(t) {
    if (t > T_OUT + 0.6) return;
    const b = t >= T_AB, clip = b ? this.pB : this.pA, an = b ? PB : PA;
    const im = clip.at(t);
    if (!im) return;
    const z = lerpTab(b ? ZOOM_B : ZOOM_A, t - clip.audio_at);
    const k = PROF.s / z, dy = 900 * Anim.ease.inCubic(Anim.clamp01((t - T_OUT) / 0.45));
    imageMode(CORNER);
    image(im, PROF.x - an.ax * k, PROF.y + dy - an.ay * k, im.width * k, im.height * k);
  },

  // GPT-3 transform at t: the still (rolls in on "Meet") until the clip starts, then the clip frozen at the snip.
  gp(t) {
    if (t < G_AT) {
      const p = Anim.clamp01((t - T.meet) / 0.7);
      const dx = 700 * (1 - Anim.ease.outBack(p)), bob = 4 * Math.sin((t - T.meet) * 2 * Math.PI * 0.8);
      return { im: this.gStill, k: GP.s, ax: 921, ay: 370, x: GP.x + dx, y: GP.y - Math.abs(bob), sw: 1928, sh: 1076 };
    }
    const lt = Math.min(t, T_SNIP) - G_AT;
    const im = this.gClip.at(G_AT + lt);
    return { im, k: GP.s / lerpTab(GZOOM, lt), ax: lerpTab(GANCH, lt, 1), ay: lerpTab(GANCH, lt, 2), x: GP.x, y: GP.y,
      sw: im ? im.width : 1928, sh: im ? im.height : 1076 };
  },
  gpWorld(g, px, py) { return [g.x + (px - g.ax) * g.k, g.y + (py - g.ay) * g.k]; },
  gpt3(t, g) {
    if (t < T.meet || !g.im) return;
    imageMode(CORNER);
    image(g.im, g.x - g.ax * g.k, g.y - g.ay * g.k, g.sw * g.k, g.sh * g.k);
  },

  // Beret gag on "davinci": a second beret drops onto his own beret, then slides off before the board zoom.
  beret(t, g) {
    if (!this.sBeret || t < T.davinci || t > 10.6) return;
    const [bx, by] = this.gpWorld(g, 860, 10);
    const pin = outBounce(Anim.clamp01((t - T.davinci) / 0.55));
    const off = Anim.ease.inCubic(Anim.clamp01((t - 9.9) / 0.6));
    const x = bx + 6 + 260 * off, y = by - 700 * (1 - pin) + 520 * off * off, rot = -0.14 + 1.6 * off;
    Ex.img(this.sBeret, x, y, 118, { rot, alpha: 1 - Anim.clamp01((t - 10.3) / 0.3) });
    if (t > T.davinci + 0.18) Ex.burst(t, T.davinci + 0.2, bx, by - 20, { n: 12, color: Ex.C.amber, dist: 110, size: 9, seed: 11, shape: "line" });
  },

  robots(t) {
    const tt = t + S02_LEN;   // continue the s02 idle bob without a phase jump
    Ex.puppet(this.cxSit, tt, { ...SEAT.cx, t0: -99, from: "pop", bob: 2, speed: 0.6, phase: 0.4 });
    Ex.puppet(this.clSit, tt, { ...SEAT.cl, t0: -99, from: "pop", bob: 2, speed: 0.6, phase: 0 });
  },
  // plate crops redrawn over characters: the stage-side desk row (hides GPT-3's treads and the clip's bottom edge), the front row
  crop(x0, x1, y0) {
    if (!this.plate) return;
    const k = this.plate.width / W;
    imageMode(CORNER);
    image(this.plate, x0, y0, x1 - x0, H - y0, x0 * k, y0 * k, (x1 - x0) * k, (H - y0) * k);
  },

  // ---------- board helpers ----------
  clipRight(x0, fn) {
    drawingContext.save(); drawingContext.beginPath(); drawingContext.rect(x0, -1e5, 2e5, 2e5); drawingContext.clip();
    fn(); drawingContext.restore();
  },
  // felt duster sweeping left → right; returns the erased boundary (world x)
  sweep(t, t0, dur) {
    const p = Anim.clamp01((t - t0) / dur);
    const x = BOARD.x - 90 + (BOARD.x + BOARD.w + 180 - BOARD.x) * Anim.ease.inOutCubic(p);
    if (p > 0 && p < 1) {
      const y = 330 + 190 * Math.sin(p * Math.PI * 5);
      noStroke(); fill(243, 239, 228, 26); rect(BOARD.x, BOARD.y, Math.max(0, Math.min(x, BOARD.x + BOARD.w) - BOARD.x), BOARD.h);
      push(); translate(x, y); rotate(0.12 * Math.sin(p * 30));
      fill(0, 0, 0, 60); rect(-80, -22, 160, 56, 10);
      fill("#8A5A34"); rect(-80, -32, 160, 38, 10);
      fill("#6A6E78"); rect(-80, 2, 160, 22, 6);
      noFill(); stroke(Ex.C.ink); strokeWeight(3); rect(-80, -32, 160, 56, 10);
      pop();
      Ex.burst(t, t0 + dur * 0.5, x - 40, y + 20, { n: 14, color: Ex.C.chalk, dur: dur * 0.9, dist: 120, size: 12, seed: 3 });
    }
    return p <= 0 ? -1e4 : p >= 1 ? 1e4 : x;
  },
  // s02's chalk, exactly as it was left at the end of s02
  oldChalk() {
    const f = this.f;
    Ex.chalk("SOFTWARE ARCHAEOLOGY 101", BOARD.x + BOARD.w / 2, BOARD.y + 108, { font: f.chalk, size: 62, align: CENTER });
    Ex.chalkLine([[BOARD.x + 190, BOARD.y + 138], [BOARD.x + BOARD.w - 190, BOARD.y + 142]], 1, { weight: 5, seed: 4 });
    Ex.chalk("2022: you hold the keyboard", BOARD.x + 235, BOARD.y + 232, { font: f.chalk, size: 40 });
    Ex.chalk("2025: the model holds it", BOARD.x + 235, BOARD.y + 306, { font: f.chalk, size: 40, color: Ex.C.amber });
    Ex.chalkLine([[BOARD.x + 215, BOARD.y + 240], [BOARD.x + 185, BOARD.y + 272], [BOARD.x + 215, BOARD.y + 298]], 1, { weight: 4, seed: 9, arrow: true, head: 16 });
  },
  popS(t, t0) { return Anim.ease.outBack(Anim.clamp01((t - t0) / 0.35)); },
  cross(t, t0, x, y, r) {
    Ex.chalkLine([[x - r, y - r], [x + r, y + r]], (t - t0) / 0.18, { color: Ex.C.pink, weight: 9, seed: 21 });
    Ex.chalkLine([[x + r, y - r], [x - r, y + r]], (t - t0 - 0.16) / 0.18, { color: Ex.C.pink, weight: 9, seed: 22 });
  },
  // p05: what code-davinci-002 is (and is not)
  p05Board(t) {
    const f = this.f;
    Ex.chalk("code-davinci-002", 290, 178, { font: f.chalk, size: 74, progress: (t - 1.9) / (T.twoE - 1.9) });
    Ex.chalkLine([[285, 200], [900, 204]], (t - T.twoE) / 0.4, { weight: 5, seed: 6 });
    Ex.chalk("= the original Codex", 290, 262, { font: f.chalk, size: 48, color: Ex.C.amber, progress: (t - T.orig) / 0.9 });
    const Y = 352;
    // chat bubble, crossed out on "chat"
    let s = this.popS(t, 5.5);
    if (s > 0) {
      push(); translate(420, Y); scale(s);
      Ex.bubble(-62, -44, 124, 80, { fill: "rgba(243,239,228,0.92)", tail: "left", r: 20 });
      noStroke(); fill(Ex.C.board); [-26, 0, 26].forEach((dx) => circle(dx, -4, 13));
      pop();
      Ex.chalk("chat", 420, 452, { font: f.chalk, size: 34, align: CENTER, progress: (t - 5.6) / 0.3 });
      this.cross(t, T.chat, 420, Y, 56);
    }
    // instruction note, crossed out on "instructions"
    s = this.popS(t, T.doesnt2);
    if (s > 0) {
      push(); translate(680, Y); scale(s); rotate(0.06);
      noStroke(); fill(Ex.C.paper); rect(-50, -58, 100, 116, 6);
      stroke(Ex.C.ink); strokeWeight(3); noFill(); rect(-50, -58, 100, 116, 6);
      for (let i = 0; i < 4; i++) { noStroke(); fill(Ex.C.ink); rect(-34, -38 + i * 24, 10, 10, 2); stroke(120, 110, 100); strokeWeight(4); line(-16, -33 + i * 24, 34 - (i % 2) * 18, -33 + i * 24); }
      pop();
      Ex.chalk("instructions", 680, 452, { font: f.chalk, size: 34, align: CENTER, progress: (t - T.doesnt2 - 0.1) / 0.4 });
      this.cross(t, T.instr, 680, Y, 56);
    }
    // continues text: lines that never end, ticked on "text"
    s = this.popS(t, T.it3);
    if (s > 0) {
      const g = Anim.clamp01((t - T.it3) / 0.9);
      for (let i = 0; i < 3; i++) {
        const len = i < 2 ? 150 : 40 + 200 * Anim.ease.outCubic(Anim.clamp01((t - T.cont) / 1.4));
        Ex.chalkLine([[880, Y - 36 + i * 34], [880 + len, Y - 36 + i * 34 + (i % 2 ? 3 : -2)]], g * 3 - i, { weight: 6, seed: 30 + i, arrow: i === 2, head: 18 });
      }
      Ex.chalk("continues text", 960, 452, { font: f.chalk, size: 34, align: CENTER, color: Ex.C.amber, progress: (t - T.cont) / 0.5 });
      Ex.chalkLine([[1070, 300], [1092, 326], [1136, 270]], (t - T.text) / 0.25, { color: Ex.C.amber, weight: 9, seed: 40 });
    }
  },
  // p(x) = ∏ p(x_t | x_<t): written on "continues", slides under the cards for p06, erased before GPT-3's turn
  equation(t) {
    if (t < T.cont || t > 21.5) return;
    const f = this.f, m = Anim.ease.inOutCubic(Anim.clamp01((t - T.so) / 0.5));
    const x = 1170 - 30 * m, y = 190 + 330 * m;
    const a = Anim.clamp01((t - T.cont) / 0.5) * (1 - Anim.clamp01((t - 21.0) / 0.4));
    Ex.math("p(x) = ∏_{t} p(x_{t} | x_{<t})", x, y, { font: f.math, size: 46 - 4 * m, alpha: a });
    Ex.chalk("one token at a time", x + 4, y + 52, { font: f.chalk, size: 30, color: Ex.C.chalkDim, alpha: a, progress: (t - T.cont - 0.3) / 0.6 });
  },

  // index card; body: "desc" squiggles | "impl" code bars | string (handwritten)
  card(x, y, w, h, rot, s, o) {
    const f = this.f;
    push(); translate(x + w / 2, y + h / 2); rotate(rot); scale(s); translate(-w / 2, -h / 2);
    drawingContext.shadowColor = "rgba(0,0,0,0.35)"; drawingContext.shadowBlur = 14; drawingContext.shadowOffsetY = 6;
    noStroke(); fill(o.glow ? "#FFF6DE" : Ex.C.paper); rect(0, 0, w, h, 8);
    drawingContext.shadowColor = "transparent";
    stroke(120, 160, 210, 100); strokeWeight(1.5);
    for (let ly = 70; ly < h - 8; ly += 24) line(10, ly, w - 10, ly);
    stroke(220, 90, 90, 170); line(10, 46, w - 10, 46);
    noFill(); stroke(Ex.C.ink); strokeWeight(2.5); rect(0, 0, w, h, 8);
    noStroke(); fill(o.headColor || Ex.C.ink); textFont(f.mono); textSize(21); textAlign(LEFT, BASELINE); text(o.head, 16, 34);
    const r = Anim.rng(o.seed || 1);
    if (o.body === "desc") {
      stroke(90, 80, 70, 200); strokeWeight(3.5); noFill();
      for (let i = 0; i < 2; i++) {
        const L = (w - 40) * (i ? 0.62 : 0.9); beginShape();
        for (let u = 0; u <= L; u += 8) vertex(18 + u, 64 + i * 24 + Math.sin(u * 0.19 + i * 2) * 3.5);
        endShape();
      }
    } else if (o.body === "impl") {
      noStroke();
      const cols = [Ex.C.codeKw, Ex.C.codeFn, Ex.C.codeStr, Ex.C.codeConst, "#8C8577"];
      for (let i = 0; i < 3; i++) {
        let cx = 18 + (i === 1 ? 22 : i === 2 ? 22 : 0);
        for (let j = 0; j < 3; j++) { const bw = 24 + r() * 70; fill(cols[Math.floor(r() * cols.length)]); rect(cx, 56 + i * 24, Math.min(bw, w - 20 - cx), 11, 5); cx += bw + 10; if (cx > w - 40) break; }
      }
    } else if (typeof o.body === "string" && o.body) {
      fill(40, 36, 44); textFont(f.hand); textSize(25); textAlign(LEFT, BASELINE);
      Ex.wrap(o.body, w - 32).forEach((l, i) => text(l, 16, 78 + i * 28));
    }
    pop();
  },
  // a card flies off the deck on the chalk ledge and lands at (x, y)
  flyCard(t, t0, x, y, w, rot, o) {
    if (t < t0) return;
    const p = Anim.clamp01((t - t0) / 0.5), e = Anim.ease.outBack(p), m = Anim.ease.outCubic(p);
    const cx = DECK.x + (x - DECK.x) * m, cy = DECK.y - 60 + (y - DECK.y + 60) * m - 90 * Math.sin(Math.PI * p);
    this.card(cx, cy, w, CH, -0.5 + (rot + 0.5) * m, 0.35 + 0.65 * e, o);
  },
  p06Board(t) {
    const f = this.f;
    Ex.chalk("teach by example = a few-shot prompt", 380, 126, { font: f.chalk, size: 38, progress: (t - 10.9) / 1.5 });
    Ex.chalkLine([[378, 138], [1010, 141]], (t - T.exampleE) / 0.35, { weight: 4, seed: 12 });
    if (this.sCards && t > 10.6) Ex.img(this.sCards, DECK.x, DECK.y, 92, { anchor: "bottom", rot: -0.04, alpha: Anim.clamp01((t - 10.6) / 0.3) });
    const rows = [[T.d1, T.i1, "desc", "impl"], [T.d2, T.i2, "desc", "impl"]];
    rows.forEach(([td, ti], i) => {
      const y = ROWS[i];
      this.flyCard(t, td - 0.2, DESC.x, y, DESC.w, -0.02 + 0.015 * i, { head: "# DESCRIPTION", body: "desc", seed: 3 + i });
      if (t > ti - 0.15) Ex.arrow(DESC.x + DESC.w + 8, y + CH / 2, IMPL.x - 10, y + CH / 2, (t - ti + 0.15) / 0.3, { weight: 4, head: 14, seed: 50 + i });
      this.flyCard(t, ti - 0.2, IMPL.x, y, IMPL.w, 0.015 - 0.02 * i, { head: "# IMPLEMENTATION", body: "impl", seed: 7 + i });
    });
    // row 3: the new description, typed on "a new description..."
    const y3 = ROWS[2];
    this.flyCard(t, T.then + 0.3, DESC.x, y3, DESC.w, -0.01,
      { head: "# DESCRIPTION", body: Anim.typed("an app to save notes and pin them", (t - T.d3) / (T.d3E - T.d3)), headColor: Ex.C.ink });
    if (t > T.empty - 0.2) Ex.arrow(DESC.x + DESC.w + 8, y3 + CH / 2, IMPL.x - 10, y3 + CH / 2, (t - T.empty + 0.2) / 0.3, { weight: 4, head: 14, seed: 53 });
    // the empty slot: dashed outline + blinking cursor, until the ribbon fills it
    if (t > T.empty && t < T_FILL + 0.05) {
      const a = Anim.clamp01((t - T.empty) / 0.2), blink = Math.floor((t - T.empty) * 3.2) % 2 === 0;
      push(); drawingContext.setLineDash([16, 11]); noFill(); stroke(243, 239, 228, 230 * a); strokeWeight(4);
      rect(IMPL.x, y3, IMPL.w, CH, 8); drawingContext.setLineDash([]);
      if (t > T.slot) { noStroke(); fill(255, 181, 61, (blink ? 255 : 60) * a); rect(IMPL.x + 22, y3 + 26, 16, 30, 2); }
      pop();
    }
    if (t >= T_FILL) {
      const s = Anim.ease.outBack(Anim.clamp01((t - T_FILL) / 0.3));
      this.card(IMPL.x, y3, IMPL.w, CH, 0.01, 0.6 + 0.4 * s, { head: "# IMPLEMENTATION", body: "impl", seed: 9, glow: t < T_FILL + 0.6 });
      Ex.burst(t, T_FILL, IMPL.x + IMPL.w / 2, y3 + CH / 2, { n: 16, color: Ex.C.amber, dist: 170, size: 10, seed: 13, shape: "line" });
    }
  },

  // ---------- g01 / p07: the tractor-feed ribbon, the stop token and the snip ----------
  ribbonP(g) {
    const [sx, sy] = this.gpWorld(g, SLOT[0], SLOT[1]);
    return [[sx, sy], [sx - 250, sy + 30], [1300, 520], [IMPL.x + IMPL.w, ROWS[2] + CH / 2]];
  },
  drawRibbon(P, u0, u1, { feed = 0, label = "", labelU = 0.2, labelP = 1, alpha = 1 } = {}) {
    if (u1 <= u0) return;
    const n = Math.max(4, Math.ceil((u1 - u0) * 60)), w = 44, L = [], R = [], C = [];
    for (let i = 0; i <= n; i++) {
      const u = u0 + ((u1 - u0) * i) / n, p = bez(P, u), q = bez(P, Math.min(1, u + 0.002)), o = bez(P, Math.max(0, u - 0.002));
      const dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
      C.push([p[0], p[1], nx, ny]); L.push([p[0] + nx * w / 2, p[1] + ny * w / 2]); R.push([p[0] - nx * w / 2, p[1] - ny * w / 2]);
    }
    push(); drawingContext.globalAlpha *= alpha;
    drawingContext.shadowColor = "rgba(0,0,0,0.3)"; drawingContext.shadowBlur = 10; drawingContext.shadowOffsetY = 5;
    fill(Ex.C.paper); stroke(Ex.C.ink); strokeWeight(2.5);
    beginShape(); L.forEach((p) => vertex(...p)); R.slice().reverse().forEach((p) => vertex(...p)); endShape(CLOSE);
    drawingContext.shadowColor = "transparent";
    // sprocket holes along both edges, scrolling with the feed
    noStroke(); fill(150, 140, 120);
    let acc = 0;
    for (let i = 1; i < C.length; i++) {
      const seg = Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]);
      const before = acc; acc += seg;
      const k0 = Math.ceil((before + feed) / 22), k1 = Math.floor((acc + feed) / 22);
      for (let k = k0; k <= k1; k++) {
        const u = (k * 22 - feed - before) / seg, x = C[i - 1][0] + (C[i][0] - C[i - 1][0]) * u, y = C[i - 1][1] + (C[i][1] - C[i - 1][1]) * u;
        const [nx, ny] = [C[i][2], C[i][3]];
        circle(x + nx * (w / 2 - 7), y + ny * (w / 2 - 7), 6); circle(x - nx * (w / 2 - 7), y - ny * (w / 2 - 7), 6);
      }
    }
    if (label && labelU >= u0 && labelU <= u1) {
      const p = bez(P, labelU), q = bez(P, labelU + 0.01);
      let a = Math.atan2(q[1] - p[1], q[0] - p[0]);
      if (a > Math.PI / 2) a -= Math.PI; else if (a < -Math.PI / 2) a += Math.PI;
      push(); translate(p[0], p[1]); rotate(a); fill(Ex.C.ink); textFont(this.f.mono); textSize(20); textAlign(CENTER, CENTER);
      text(Anim.typed(label, labelP), 0, 1); pop();
    }
    pop();
  },
  ribbon(t, g) {
    if (t < T.impl - 0.05 || t > T_WIPE2 + 0.5) return;
    const P = this.ribbonP(g), UC = 0.4;
    const tip = Anim.ease.outCubic(Anim.clamp01((t - T.impl + 0.05) / (T_FILL - T.impl + 0.05)));
    const feed = 150 * (Math.min(t, T_SNIP) - T.impl);
    const fade = 1 - Anim.clamp01((t - T_WIPE2) / 0.4);
    const label = { label: "# DESCRIPTION", labelU: 0.2, labelP: (t - 22.95) / 0.45 };
    if (t < T_SNIP) { this.drawRibbon(P, 0, tip, { feed, ...(t > 22.95 ? label : {}) }); return; }
    // snipped: the slot side stays pinned to the card, the invented continuation falls away
    this.drawRibbon(P, UC + 0.01, 1, { feed, alpha: fade });
    const dt = t - T_SNIP, c = bez(P, UC);
    if (dt < 1.6) {
      push(); translate(c[0] + 40 * dt, c[1] + 260 * dt * dt); rotate(-0.6 * dt); translate(-c[0], -c[1]);
      this.drawRibbon(P, 0, UC - 0.01, { feed, ...label, labelP: 1, alpha: 1 - Anim.clamp01((dt - 1.0) / 0.6) });
      pop();
    }
  },
  stopSign(t) {
    if (!this.sStop || t < T.stop || t > 26.5) return;
    const f = this.f, p = Anim.clamp01((t - T.stop) / 0.28), s = Anim.ease.outBack(p), h = 230;
    const a = 1 - Anim.clamp01((t - 26.05) / 0.4), wob = 0.22 * (1 - p) * Math.sin(p * 18);
    push(); translate(1420, 300 + 60 * (1 - s)); rotate(wob); scale(s); drawingContext.globalAlpha *= a;
    Ex.img(this.sStop, 0, 0, h);
    fill("#FFFFFF"); noStroke(); textFont(f.title); textSize(64); textAlign(CENTER, CENTER); text("STOP", 0, -0.127 * h + 2);
    pop();
    Ex.chalk('stop: "# DESCRIPTION"', 1420, 172, { font: f.chalk, size: 32, align: CENTER, progress: (t - T.stop - 0.1) / 0.5, alpha: a });
  },
  scissors(t, g) {
    if (!this.sScis || t < 23.5 || t > 24.9) return;
    const c = bez(this.ribbonP(g), 0.4), h = 130, w = h * this.sScis.width / this.sScis.height;
    const pin = Anim.ease.outCubic(Anim.clamp01((t - 23.5) / 0.35)), pout = Anim.ease.inCubic(Anim.clamp01((t - 24.4) / 0.45));
    const snap = t > T_SNIP ? Math.max(0, 1 - Math.abs(t - T_SNIP - 0.06) / 0.08) : 0;
    const x = c[0] - w * 0.44 - 260 * (1 - pin) - 200 * pout, y = c[1] + 8 - 140 * (1 - pin) - 260 * pout;
    Ex.img(this.sScis, x, y, h, { rot: -0.25 + 0.3 * (1 - pin), sy: 1 - 0.42 * snap, alpha: 1 - pout });
  },

  // ---------- p07: parameters ----------
  params(t) {
    if (t < 26.8) return;
    const f = this.f, s = Anim.ease.outBack(Anim.clamp01((t - 26.8) / 0.35));
    push(); translate(780, 295); scale(s); translate(-780, -295);
    const o = Ex.window(380, 130, 800, 330, { title: "lib/gpt_prompt.rb · env.rb", theme: "editor", font: f.mono });
    const lines = ["# settings recorded in the repo", 'model: "code-davinci-002"', "temperature: 0.3", "top_p: 0.99", "max_tokens: 600",
      'stop: ["# DESCRIPTION", "# IMPLEMENTATION"]'];
    const hl = t < T.temp ? 5 : t < T.six ? 2 : 4;
    drawingContext.save(); drawingContext.beginPath(); drawingContext.rect(380, 130, 800, 330); drawingContext.clip();
    Ex.code(lines, o.x, o.y, { font: f.mono, size: 26, progress: (t - 26.85) / 0.4, highlight: t > 27.0 ? [hl] : [], dim: 0.4, cursor: false });
    drawingContext.restore();
    pop();
    // thermometer, 0–2 scale (the Completions docs: lower = more focused and deterministic, higher = more random)
    if (t > T.temp - 0.1) {
      const a = Anim.clamp01((t - T.temp + 0.1) / 0.3), X = 1255, top = 175, bot = 445, vy = (v) => bot - (v / 2) * (bot - top);
      push(); drawingContext.globalAlpha *= a;
      noFill(); stroke(Ex.C.chalk); strokeWeight(4); rect(X - 14, top - 14, 28, bot - top + 28, 14); circle(X, bot + 34, 58);
      const v = 0.3 * Anim.ease.outCubic(Anim.clamp01((t - T.zero2) / (T.threeE - T.zero2)));
      noStroke(); fill(Ex.C.amber); circle(X, bot + 34, 44); rect(X - 7, vy(v), 14, bot + 20 - vy(v), 7);
      stroke(Ex.C.chalk); strokeWeight(3);
      [0, 1, 2].forEach((k) => line(X - 24, vy(k), X - 16, vy(k)));
      pop();
      [0, 1, 2].forEach((k) => Ex.chalk(String(k), X - 32, vy(k) + 10, { font: f.chalk, size: 28, align: RIGHT, alpha: a }));
      Ex.chalk("temperature", X, 140, { font: f.chalk, size: 32, align: CENTER, alpha: a });
      Ex.chalk("higher → more random", X + 30, vy(1.8) + 10, { font: f.chalk, size: 25, color: Ex.C.chalkDim, alpha: a });
      Ex.chalk("lower → more focused,", X + 30, vy(0.35) - 18, { font: f.chalk, size: 25, color: Ex.C.chalkDim, alpha: a });
      Ex.chalk("deterministic", X + 30, vy(0.35) + 14, { font: f.chalk, size: 25, color: Ex.C.chalkDim, alpha: a });
      if (t > T.three) {
        Ex.chalkLine([[X + 20, vy(0.3)], [X + 60, vy(0.3) + 40]], (t - T.three) / 0.25, { color: Ex.C.amber, weight: 4, seed: 70 });
        Ex.chalk("0.3", X + 66, vy(0.3) + 62, { font: f.chalk, size: 40, color: Ex.C.amber, progress: (t - T.three - 0.15) / 0.3 });
      }
    }
    // max_tokens: a budget bar that fills to 600 and gets stamped
    if (t > T.six - 0.1) {
      const a = Anim.clamp01((t - T.six + 0.1) / 0.3), x0 = 400, x1 = 1180, y = 520;
      const p = Anim.ease.inOutCubic(Anim.clamp01((t - T.six) / (T.tokensE - T.six)));
      const n = Math.round(600 * p);
      push(); drawingContext.globalAlpha *= a;
      noStroke(); fill(255, 181, 61, t > T.max && Math.floor(t * 8) % 2 ? 255 : 215); rect(x0, y, (x1 - x0) * p, 38, 8);
      noFill(); stroke(Ex.C.chalk); strokeWeight(4); rect(x0, y, x1 - x0, 38, 8);
      pop();
      Ex.chalk(`${n} / 600 tokens`, x0, y - 14, { font: f.chalk, size: 32, alpha: a });
      if (t > T.max) { push(); translate(x1 - 110, y + 19); rotate(-0.14); noStroke(); fill(16, 21, 34, 225); rect(-95, -48, 190, 96, 12); pop(); }
      Ex.stamp(t, T.max, "MAX", x1 - 110, y + 19, { font: f.title, size: 58, color: Ex.C.pink, rot: -0.14 });
    }
  },

  draw(t) {
    const f = this.f, K = width / W;
    background(Ex.C.ink);
    // keys keep the plate inside the frame: |x - 960| <= 960 - 960/z, |y - 540| <= 540 - 540/z
    const cam = Ex.cam(t, [
      { t: 0, x: 950, y: 548, z: 1.05 },   // = s02 end camera
      { t: T.meet, x: 972, y: 541, z: 1.07, ease: "linear" },
      { t: T.davinci - 0.02, x: 990, y: 540, z: 1.08, ease: "linear" },
      { t: T.davinci + 0.16, x: 1150, y: 565, z: 1.25, ease: "outExpo" },   // punch on "davinci" (beret gag)
      { t: 2.0, x: 1156, y: 567, z: 1.26, ease: "linear" },
      { t: 2.6, x: 975, y: 528, z: 1.07, ease: "inOutCubic" },
      { t: T_AB - 0.01, x: 985, y: 525, z: 1.08, ease: "linear" },
      { t: T_AB + 0.1, x: 975, y: 535, z: 1.12, ease: "outExpo" },           // snap hides the prof_intro → prof_intro_b cut
      { t: T_OUT, x: 985, y: 528, z: 1.13, ease: "linear" },
      { t: T.so + 0.4, x: 960, y: 360, z: 1.55, ease: "inOutCubic" },        // whip into the board
      { t: 19.9, x: 935, y: 378, z: 1.58, ease: "linear" },
      { t: T.impl + 0.05, x: 1133, y: 480, z: 1.22, ease: "inOutCubic" },     // widen: GPT-3 prints into the slot
      { t: T_WIPE2, x: 1128, y: 470, z: 1.22, ease: "linear" },
      { t: 27.0, x: 960, y: 490, z: 1.12, ease: "inOutCubic" },             // parameters
      { t: 31.2, x: 960, y: 494, z: 1.12, ease: "linear" },
      { t: 32.0, x: 960, y: 540, z: 1.0, ease: "inOutCubic" }                // neutral hall key for s04
    ]);
    const shk = t > T_SNIP && t < T_SNIP + 0.2 ? [Math.sin(t * 130) * 9 * (1 - (t - T_SNIP) / 0.2), 0] : [0, 0];
    const g = this.gp(t);
    Ex.withCam({ ...cam, z: cam.z * K }, () => {
      if (this.plate) { imageMode(CORNER); image(this.plate, 0, 0, W, H); }
      // board: s02 chalk erased on "Meet", p05 notes erased on "So", p06 cards erased after "example."
      const x1 = this.sweep(t, 0.15, 0.5), x2 = this.sweep(t, T_WIPE1, 0.45), x3 = this.sweep(t, T_WIPE2, 0.45);
      this.clipRight(x1, () => this.oldChalk());
      if (t > 1.5 && t < T_WIPE1 + 0.5) this.clipRight(x2, () => this.p05Board(t));
      this.equation(t);
      if (t > T_WIPE1 && t < T_WIPE2 + 0.5) this.clipRight(x3, () => this.p06Board(t));
      this.params(t);
      // GPT-3 on stage, the stage-side desk row over its treads, the seated robots, the front desks
      this.gpt3(t, g);
      this.beret(t, g);
      this.crop(1150, W, 880);
      this.robots(t);
      this.crop(880, 1600, DESK_Y);
      this.ribbon(t, g);
      this.stopSign(t);
      this.scissors(t, g);
      if (t > T_SNIP) Ex.burst(t, T_SNIP + 0.03, ...bez(this.ribbonP(g), 0.4), { n: 18, color: Ex.C.chalk, dist: 150, size: 12, seed: 17, shape: "line" });
      Ex.stamp(t, T_SNIP + 0.12, "STOP TOKEN", 1400, 470, { font: f.title, size: 46, color: Ex.C.pink, rot: -0.1, t1: 26.3 });
      this.prof(t);
    }, shk);
    // PhD card (screen space, right; the camera is on the board, no faces under it)
    Ex.card(t, 13.0, 17.6, width - 628 * K, 120 * K, 600 * K, { fonts: { tag: f.tag, title: f.math, body: f.bodyR, cite: f.bodyR },
      size: 21 * K, title: "In-context learning: ∇θ = 0",
      body: "Few-shot = a few demonstrations of the task given at inference time as conditioning; no weight updates are allowed. GPT-3: 175B parameters, 2048-token context.",
      cite: "Brown et al. 2020 · arXiv:2005.14165" });
    Ex.caption(t, this.ph, { font: f.body, size: 34, speakers: { prof: "#FFFFFF", gpt3: "#E8D9B5" } });
    Ex.vignette(0.3);
  }
});
