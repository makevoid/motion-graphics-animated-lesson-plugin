// s04 the Ruby pipeline (song 63.375–90.958 s, frames 1521–2183; t is section-local). Plate = s01/hall, redrawn inside the camera.
// p08 0.31–19.52 "This repo chained those templates in Ruby … pray for status OK." · p09 19.91–27.12 "For crashes … written by hand."
//
// One camera in hall-world units. The diagram lives INSIDE the chalkboard: diagram units (DW × DH) are mapped onto the board's
// inner rect at scale SD, so "zooming into the board" is just a big camera zoom (z_hall = z_diag / SD) and the 3b1b-style reveal
// is a pull-back to the hall with the whole pipeline chalked on the board. The plate's board texture stays the diagram's background.
// First key = neutral hall key (960, 540, z 1.0): prompts/s03/05_overlay.js did not exist when this was written.
// GPT-3 (H3 gpt3_run, no audio) is a ping-pong run cycle translated along the diagram; the prof is a screen-space still puppet.
const W = 1920, H = 1080;
const BOARD = { x: 237, y: 87, w: 1430, h: 529 };
const DW = 6400, DH = 2000, SD = BOARD.w / DW, OY = BOARD.y + (BOARD.h - DH * SD) / 2;
const D = (x, y, z = 1, ease) => ({ x: BOARD.x + x * SD, y: OY + y * SD, z: z / SD, ease });   // diagram-space camera key
const Hk = (x, y, z, ease) => ({ x, y, z, ease });                                               // hall-space camera key

// diagram layout (diagram units; 1 unit = 1 screen px at diagram zoom 1)
const CONFIG = { x: 720, y: 600, w: 720, h: 200 };
const MILL = { x: 1400, y: 600, h: 560 };
const SPEC = { x: 1930, y: 640, w: 300, h: 250 };
const MACH_H = 300, MACH_S = MACH_H / 456;                     // machine sprite 752×456: intake mouth ≈ (38, 175), outlet ≈ (720, 260)
const M0 = { x: 2420, y: 560 };
const MACH = [0, 1, 2].map((i) => ({ x: M0.x + i * 682 * MACH_S, y: M0.y + i * 85 * MACH_S }));   // outlet of k feeds intake of k+1
const MLABEL = ["per model", "per method", "per route"];
const HOUR = { x: 3950, y: 640, h: 440 }, CLOCK = { x: 4230, y: 470, r: 95 };
const FILES = { x: 4660, y: 650 };
const SERVER = { x: 5200, y: 620, h: 460 };
const TERM = { x: 5430, y: 420, w: 760, h: 260 };
const SLOTS = { x: 5560, y: 900, h: 280 };
const LOOP = { x: 3500, y: 1450, r: 300 };
const HEAD = { x: 3200, y: 60 };
const FLOOR = 1000;
// w7-gears: gears-v1 sprites (source px). cx,cy = hub centre (alpha centroid), rp = pitch radius ((tip+root)/2), n = teeth,
// a0 = angle of a tooth centre at rotation 0 (y-down, radians). Measured on output/gears-v1/sprites (see docs/reviews/gears.md).
const GEARS = [
  { n: "gear_l", cx: 527.4, cy: 502.0, rp: 474.3, n_t: 18, a0: (19.2 * Math.PI) / 180 },
  { n: "gear_m", cx: 402.4, cy: 400.6, rp: 360.3, n_t: 13, a0: (22.0 * Math.PI) / 180 },
  { n: "gear_s", cx: 303.0, cy: 301.4, rp: 268.3, n_t: 10, a0: (16.5 * Math.PI) / 180 }
];
const GEAR_K = 0.19;                                     // source px → diagram units for the large (driver) gear
const GEAR_MESH = [null, { to: 0, ang: (60 * Math.PI) / 180 }, { to: 0, ang: (-20 * Math.PI) / 180 }];   // m (lower right) and s (upper right) both mesh with l; m and s never touch
const GEAR_GAP = 1.04;                                   // a little backlash: square cartoon teeth overlap at exactly R1 + R2
const GEAR_L0 = { x: -40, y: -50 };                        // driver centre, relative to (LOOP.x, LOOP.y + 10)
const GEAR_LAYOUT = (() => {
  const pitch = (2 * Math.PI * GEARS[0].rp * GEAR_K) / GEARS[0].n_t;   // one shared circular pitch so the teeth really mesh
  const out = [];
  GEARS.forEach((g, i) => {
    const k = (pitch * g.n_t) / (2 * Math.PI * g.rp);                   // per-gear scale that gives this gear the shared pitch
    const R = g.rp * k, m = GEAR_MESH[i];
    if (!m) { out.push({ ...g, k, R, x: GEAR_L0.x, y: GEAR_L0.y, ratio: 1, phi0: 0 }); return; }
    const A = out[m.to], th = m.ang, d = (A.R + R) * GEAR_GAP;
    const x = A.x + Math.cos(th) * d, y = A.y + Math.sin(th) * d, ratio = (-A.ratio * A.n_t) / g.n_t;
    // tooth units at the contact line: uA + uB ≡ 0.5 (mod 1) puts a gap of B against a tooth of A
    const uA = ((th - A.a0 - A.phi0) * A.n_t) / (2 * Math.PI), uB = 0.5 - uA;
    const phi0 = th + Math.PI - g.a0 - (uB * 2 * Math.PI) / g.n_t;
    out.push({ ...g, k, R, x, y, ratio, phi0 });
  });
  return out;
})();
const ORB = { x: 3500, y: 1620, rx: 520, ry: 340, a0: -Math.PI / 2 - 0.35 };   // robot orbit round the repair loop (feet)

const COMMITS = [
  { hash: "63bd846", date: "2022-11-14", msg: "initial commit" },
  { hash: "·······", date: "", msg: "try different prompts" },
  { hash: "·······", date: "", msg: "generate route" },
  { hash: "·······", date: "", msg: "fix prompt route, add sample spec" },
  { hash: "·······", date: "Dec 27", msg: "update prompts and code to a first working version" }
];

const { clamp01, ease } = Anim;
const P = (t, t0, dur) => clamp01((t - t0) / dur);

Anim.sketch({
  async load() {
    this.f = await Anim.fonts({ chalk: "chalk.ttf", mono: "mono.ttf", code: "mono-andale.ttf", tag: "din-alt.ttf", title: "din-cond.ttf", body: "body-med.ttf",
      bodyR: "body.ttf", hand: "hand.ttf", math: "math.otf" });
    const img = (p) => new Promise((ok) => loadImage(p, ok, () => ok(null)));
    this.plate = await img("/output/s01/02_kf_hall.png");
    const sp = {};
    for (const n of ["machine", "mill", "hourglass", "server", "prayer", "slots", "gem", "gears"]) sp[n] = await img(`/output/diagram-c-v1/sprites/${n}.png`);
    for (const g of GEARS) sp[g.n] = await img(`/output/gears-v1/sprites/${g.n}.png`);   // w7-gears: one sprite per gear
    this.sp = sp;
    this.run = await Anim.clip("gpt3_run");
    this.prof = (await Anim.clip("prof_walk")).frame(0);
    // character bounds (alpha scan on a small copy) so sprites are placed by their feet, not by their frame
    const g = createGraphics(240, 136); g.pixelDensity(1);
    const bbox = (im) => {
      g.clear(); g.image(im, 0, 0, 240, 136); g.loadPixels();
      let x0 = 240, y0 = 136, x1 = 0, y1 = 0;
      for (let y = 0; y < 136; y++) for (let x = 0; x < 240; x++) if (g.pixels[(y * 240 + x) * 4 + 3] > 120) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      return { x0: x0 / 240, x1: x1 / 240, y0: y0 / 136, y1: y1 / 136 };
    };
    this.profBox = bbox(this.prof);
    this.runBox = bbox(this.run.frame(0));
    g.remove();
    this.words = Anim.data("words").map((w) => ({ ...w, speaker: "prof", line: w.s < 19.7 ? "p08" : "p09" }));
    this.cue = Anim.cues(this.words);
    this.ph = Ex.phrases(this.words).map((p, i, a) => (a[i + 1] ? { ...p, e: Math.min(p.e, a[i + 1].s - 0.45) } : p));
  },

  // ---------- camera ----------
  camKeys() {
    const c = this.cue;
    if (this._keys) return this._keys;
    const tOne = c("One").s, tThen = c("Then").s, tSleep = c("Sleep").s, tStitch = c("Stitch").s, tBoot = c("boot").s;
    const tPray = c("pray").s, tOK = c("OK").s, tFor = c("for", 2).s, tTpl = c("template").s, tRep = c("repair").s, tHand = c("hand").s;
    this._keys = [
      Hk(960, 540, 1.0),                                          // = neutral hall key (s03 end)
      Hk(956, 360, 1.5, "inOutCubic"), Hk(958, 342, 1.6, "linear"),  // push onto the chalk header
      { ...Hk(958, 340, 1.62, "linear"), t: tOne - 0.02 },
      { ...D(1200, 720, 1.0, "inOutCubic"), t: tOne + 1.05 },     // dive into the board: config → mill
      { ...D(1340, 725, 1.04, "linear"), t: tThen - 0.1 },
      { ...D(2330, 700, 1.0, "inOutCubic"), t: tThen + 0.9 },     // follow GPT-3 down the machine chain
      { ...D(3140, 720, 1.0, "linear"), t: tSleep - 0.45 },
      { ...D(3930, 800, 1.15, "outCubic"), t: tSleep + 0.2 },     // snap to the hourglass
      { ...D(3970, 790, 1.24, "linear"), t: tStitch - 0.1 },
      { ...D(4720, 800, 1.08, "inOutCubic"), t: tStitch + 0.55 },
      { ...D(4800, 800, 1.1, "linear"), t: tBoot - 0.2 },
      { ...D(5480, 760, 1.12, "inOutCubic"), t: tBoot + 0.55 },   // server + terminal
      { ...D(5500, 770, 1.14, "linear"), t: tPray - 0.05 },
      { ...D(5520, 790, 1.26, "outExpo"), t: tPray + 0.25 },      // push on "pray"
      { ...D(5530, 700, 1.28, "linear"), t: tOK - 0.05 },
      { ...D(5580, 700, 1.42, "outExpo"), t: tOK + 0.2 },         // snap on "OK"
      { ...D(5585, 702, 1.43, "linear"), t: tOK + 0.75 },
      { ...Hk(952, 404, 1.34, "inOutCubic"), t: tFor + 0.55 },    // 3b1b reveal: the whole pipeline on the board
      { ...Hk(954, 405, 1.35, "linear"), t: tTpl - 0.2 },
      { ...D(3500, 1440, 1.0, "inOutCubic"), t: tTpl + 0.75 },    // dive to the repair loop
      { ...D(3500, 1440, 1.06, "linear"), t: tRep },
      { ...D(3500, 1420, 1.12, "outCubic"), t: tRep + 0.5 },
      { ...D(3500, 1430, 1.14, "linear"), t: tHand },
      { ...D(3520, 1470, 0.92, "inOutCubic"), t: 27.58 }
    ];
    // the first three keys: t 0 (hold), 0.4 → 1.9 push
    this._keys[0].t = 0; this._keys[1].t = 1.9; this._keys[2].t = 3.0;
    // interpolate zoom in log space (Ex.cam lerps whatever it's given)
    this._keys = this._keys.map((k) => ({ ...k, z: Math.log(k.z) }));
    return this._keys;
  },
  cam(t) { const k = Ex.cam(t, this.camKeys()); return { ...k, z: Math.exp(k.z) }; },

  // ---------- pieces (diagram space) ----------
  sprite(n, x, y, h, o) { Ex.img(this.sp[n], x, y, h, o); },
  pop(t, t0, d = 0.35) { return ease.outBack(P(t, t0, d)); },

  header(t) {
    const f = this.f, c = this.cue;
    const str = "gpt3_generate_app: templates in Ruby";
    push(); textFont(f.chalk); textSize(110); const tw = textWidth(str); pop();
    Ex.chalk(str, HEAD.x, HEAD.y, { font: f.chalk, size: 110, align: CENTER, progress: (t - c("This").s) / (c("Ruby").s + 0.3 - c("This").s) });
    Ex.chalkLine([[HEAD.x - tw / 2, HEAD.y + 34], [HEAD.x + tw / 2, HEAD.y + 40]], P(t, c("Ruby").e, 0.45), { weight: 10, seed: 3 });
    const tr = c("Ruby").s, s = this.pop(t, tr, 0.45);
    if (s > 0) {
      const gx = HEAD.x + tw / 2 + 190, gy = HEAD.y - 50;
      Ex.burst(t, tr + 0.05, gx, gy, { n: 22, color: Ex.C.ruby, dist: 330, size: 22, seed: 11 });
      Ex.img(this.sp.gem, gx, gy + Math.sin(t * 3) * 10, 300 * s, { rot: 0.12 * Math.sin(t * 2) });
    }
  },

  config(t) {
    const f = this.f, c = this.cue, t0 = c("idea").s - 0.1;
    if (t < t0) return;
    const into = P(t, c("into").s - 0.05, 0.55);
    if (into >= 1) return;
    const e = ease.inCubic(into), a = 1 - Math.max(0, (into - 0.6) / 0.4);
    // arc from its slot into the mill funnel, shrinking
    const fx = MILL.x - 40, fy = MILL.y - MILL.h * 0.4;
    const x = CONFIG.x + (fx - CONFIG.x) * e, y = CONFIG.y + (fy - CONFIG.y) * e - Math.sin(e * PI) * 260;
    const s = this.pop(t, t0, 0.4) * (1 - 0.8 * e);
    push(); translate(x, y); scale(s); rotate(0.5 * e); drawingContext.globalAlpha *= a;
    const o = Ex.window(-CONFIG.w / 2, -CONFIG.h / 2, CONFIG.w, CONFIG.h, { title: "config.yml", theme: "paper", font: f.mono });
    const str = "\"an app to save notes and pin them\"";
    const p = (t - c("an", 2).s) / (c("them").e - c("an", 2).s);
    textFont(f.mono); textSize(31); textAlign(LEFT, TOP); noStroke(); fill("#3E6B2A");
    text(Anim.typed(str, clamp01(p)), o.x, o.y + 18);
    pop();
  },

  mill(t) {
    const f = this.f, c = this.cue, t0 = c("One").s + 0.7;
    const s = this.pop(t, t0, 0.45);
    if (s <= 0) return;
    const crank = t > c("into").s + 0.3 && t < c("spec").e + 0.3;
    const shake = crank ? Math.sin(t * 60) * 5 : 0;
    Ex.img(this.sp.mill, MILL.x + shake, MILL.y, MILL.h * s, { sy: crank ? 1 + 0.03 * Math.sin(t * 30) : 1 });
    Ex.chalk("prompt_app", MILL.x, MILL.y + MILL.h / 2 + 75, { font: f.mono, size: 58, align: CENTER, color: Ex.C.amber, progress: P(t, t0 + 0.2, 0.5) });
    if (crank) Ex.burst(t, c("spec").s - 0.1, MILL.x + 60, MILL.y + 150, { n: 14, color: Ex.C.chalk, dist: 160, size: 10, seed: 4 });
    // arrows: idea → mill, mill → spec
    Ex.arrow(CONFIG.x + CONFIG.w / 2 + 20, CONFIG.y + 20, MILL.x - 270, MILL.y + 10, P(t, c("idea").s + 0.3, 0.45), { bend: -30, weight: 7, seed: 5 });
  },

  spec(t) {
    const f = this.f, c = this.cue, t0 = c("spec").s - 0.1;
    if (t < t0) return;
    const e = ease.outBack(P(t, t0, 0.55));
    const x = MILL.x + 120 + (SPEC.x - MILL.x - 120) * e, y = MILL.y + 220 + (SPEC.y - MILL.y - 220) * e;
    push(); translate(x, y); rotate(-0.05 * e); scale(0.3 + 0.7 * e);
    drawingContext.shadowColor = "rgba(0,0,0,0.35)"; drawingContext.shadowBlur = 24; drawingContext.shadowOffsetY = 10;
    noStroke(); fill(Ex.C.paper); rect(-SPEC.w / 2, -SPEC.h / 2, SPEC.w, SPEC.h, 10);
    drawingContext.shadowColor = "transparent";
    fill(Ex.C.ink); textFont(f.title); textSize(64); textAlign(CENTER, TOP); text("SPEC", 0, -SPEC.h / 2 + 18);
    textFont(f.mono); textSize(28); textAlign(LEFT, TOP); fill("#5A4A36");
    ["• models", "• methods", "• routes"].forEach((l, i) => text(l, -SPEC.w / 2 + 34, -SPEC.h / 2 + 100 + i * 42));
    pop();
    Ex.arrow(SPEC.x + SPEC.w / 2 + 10, SPEC.y - 40, MACH[0].x - 250, MACH[0].y - 55, P(t, c("Then").s, 0.45), { bend: -60, weight: 7, seed: 6 });
  },

  machines(t) {
    const f = this.f, c = this.cue, tThen = c("Then").s;
    const tLab = [c("model").s, c("method").s, c("route").s];
    MACH.forEach((m, i) => {
      const t0 = tThen + 0.35 + i * 0.12, s = this.pop(t, t0, 0.4);
      if (s <= 0) return;
      const busy = t > tLab[i] - 0.1 && t < tLab[i] + 1.0;
      const jig = busy ? Math.sin(t * 45 + i) * 4 : 0;
      Ex.img(this.sp.machine, m.x + jig, m.y, MACH_H * s);
      // face label (the cream panel sits a little left of centre)
      if (s > 0.9) {
        push(); textFont(f.mono); textSize(38); textAlign(CENTER, CENTER); noStroke(); fill(Ex.C.ink);
        drawingContext.globalAlpha *= P(t, tLab[i] - 0.25, 0.25) * 0.85 + 0.15;
        text(MLABEL[i], m.x - 10 + jig, m.y + 10); pop();
      }
      // N calls fan out of the top on its word
      const n = 3 + i, top = m.y - MACH_H / 2 + 10;
      for (let k = 0; k < n; k++) {
        const pk = P(t, tLab[i] + k * 0.07, 0.35);
        if (pk <= 0) continue;
        const dx = (k - (n - 1) / 2) * 105, cx = m.x + dx, cy = top - 85 - (k % 2) * 36;
        Ex.chalkLine([[m.x + dx * 0.15, top], [cx, cy + 24]], pk, { weight: 4, seed: 20 + i * 7 + k, color: Ex.C.chalkDim });
        if (pk > 0.6) {
          const e = ease.outBack(P(t, tLab[i] + k * 0.07 + 0.2, 0.3));
          push(); translate(cx, cy); scale(e); noStroke(); fill(Ex.C.amber); rect(-44, -22, 88, 44, 9);
          fill(Ex.C.ink); textFont(f.mono); textSize(22); textAlign(CENTER, CENTER); text("call", 0, -1); pop();
        }
      }
      if (t > tLab[i] + 0.4) Ex.chalk("×N", m.x + ((n - 1) / 2) * 105 + 70, top - 90, { font: f.chalk, size: 44, progress: P(t, tLab[i] + 0.4, 0.3), color: Ex.C.amber });
    });
    Ex.arrow(MACH[2].x + 250, MACH[2].y + 40, HOUR.x - 150, HOUR.y + 40, P(t, c("Sleep").s - 0.3, 0.4), { bend: -40, weight: 7, seed: 8 });
  },

  hourglass(t) {
    const f = this.f, c = this.cue, tS = c("Sleep").s;
    const s = this.pop(t, tS - 0.35, 0.35);
    if (s <= 0) return;
    const flip = ease.inOutCubic(P(t, tS + 0.05, 0.4));
    Ex.img(this.sp.hourglass, HOUR.x, HOUR.y, HOUR.h * s, { rot: PI * flip });
    // falling sand in the neck once flipped
    if (flip >= 1) {
      const r = Anim.rng(3); noStroke(); fill("#E8C27A");
      for (let i = 0; i < 12; i++) { const ph = (t * 1.6 + r()) % 1; circle(HOUR.x + (r() - 0.5) * 8, HOUR.y - 10 + ph * 120, 7); }
    }
    // chalk clock: 30 s pass in 1.4 s
    const cp = P(t, c("thirty").s, 0.3);
    if (cp > 0) {
      push(); stroke(Ex.C.chalk); strokeWeight(6); noFill(); drawingContext.globalAlpha *= cp;
      circle(CLOCK.x, CLOCK.y, CLOCK.r * 2);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TWO_PI; line(CLOCK.x + Math.cos(a) * CLOCK.r * 0.8, CLOCK.y + Math.sin(a) * CLOCK.r * 0.8, CLOCK.x + Math.cos(a) * CLOCK.r * 0.95, CLOCK.y + Math.sin(a) * CLOCK.r * 0.95); }
      const sweep = ease.inOutCubic(P(t, c("seconds").s, 1.4)), a = -HALF_PI + sweep * TWO_PI;
      stroke(Ex.C.amber); strokeWeight(8); line(CLOCK.x, CLOCK.y, CLOCK.x + Math.cos(a) * CLOCK.r * 0.78, CLOCK.y + Math.sin(a) * CLOCK.r * 0.78);
      noStroke(); fill(Ex.C.amber); circle(CLOCK.x, CLOCK.y, 16);
      pop();
      const left = Math.round(30 * (1 - sweep));
      Ex.chalk(`${left}s`, CLOCK.x + CLOCK.r + 30, CLOCK.y + 24, { font: f.title, size: 72, align: LEFT, color: left ? Ex.C.chalk : Ex.C.amber, alpha: cp });
    }
    // the Ruby line itself
    const kp = P(t, tS, 0.5);
    if (kp > 0) {
      push(); translate(CLOCK.x, CLOCK.y + CLOCK.r + 90); scale(this.pop(t, tS, 0.35));
      noStroke(); fill(Ex.C.codeBg); rect(-130, -36, 260, 72, 12);
      textFont(f.mono); textSize(38); textAlign(LEFT, CENTER);
      const str = Anim.typed("sleep 30", kp), sx = -textWidth("sleep 30") / 2;
      fill(Ex.C.codeFn); text(str.slice(0, 5), sx, 0); fill(Ex.C.codeNum); text(str.slice(5), sx + textWidth("sleep"), 0);
      pop();
    }
    Ex.arrow(HOUR.x + 120, HOUR.y + 150, FILES.x - 170, FILES.y + 60, P(t, c("Stitch").s - 0.1, 0.35), { bend: 40, weight: 7, seed: 9 });
  },

  files(t) {
    const f = this.f, c = this.cue, tS = c("Stitch").s, tM = c("files").e - 0.1;
    if (t < tS - 0.1) return;
    const merge = ease.inOutCubic(P(t, tM, 0.35));
    const names = ["models", "methods", "routes"];
    if (merge < 1) {
      names.forEach((n, i) => {
        const e = this.pop(t, tS - 0.1 + i * 0.08, 0.3);
        const y = FILES.y - 150 + i * 150 + (FILES.y - (FILES.y - 150 + i * 150)) * merge;
        push(); translate(FILES.x + (i - 1) * 16 * (1 - merge), y); rotate((i - 1) * 0.06 * (1 - merge)); scale(e);
        noStroke(); fill(Ex.C.paper); rect(-120, -58, 240, 116, 8);
        fill("#C9B894"); for (let l = 0; l < 3; l++) rect(-90, -18 + l * 22, 120 + ((l * 37) % 50), 9, 4);
        fill(Ex.C.ink); textFont(f.mono); textSize(22); textAlign(LEFT, TOP); text(n, -100, -50);
        pop();
      });
      // chalk stitches down the seams
      for (let s = 0; s < 2; s++) {
        const y = FILES.y - 75 + s * 150, pts = [];
        for (let k = 0; k <= 8; k++) pts.push([FILES.x - 110 + k * 27.5, y + (k % 2 ? -14 : 14)]);
        Ex.chalkLine(pts, P(t, tS + 0.1 + s * 0.3, 0.45) * (1 - merge), { weight: 5, seed: 30 + s, color: Ex.C.amber });
      }
    }
    if (merge > 0) {
      const e = ease.outBack(P(t, tM + 0.2, 0.35));
      Ex.burst(t, tM + 0.25, FILES.x, FILES.y, { n: 16, color: Ex.C.ruby, dist: 220, size: 12, seed: 12 });
      push(); translate(FILES.x, FILES.y); scale(Math.max(merge * 0.6, e));
      drawingContext.shadowColor = "rgba(0,0,0,0.35)"; drawingContext.shadowBlur = 24; drawingContext.shadowOffsetY = 10;
      noStroke(); fill(Ex.C.paper); rect(-140, -170, 280, 340, 12);
      drawingContext.shadowColor = "transparent";
      fill(Ex.C.ruby); rect(-140, -170, 280, 64, 12, 12, 0, 0);
      fill("#FFFFFF"); textFont(f.mono); textSize(36); textAlign(CENTER, CENTER); text("app.rb", 0, -139);
      for (let l = 0; l < 8; l++) { fill(["#C9B894", "#D9A36A", "#A8B98A"][l % 3]); rect(-110 + (l % 3 === 1 ? 30 : 0), -80 + l * 30, 150 + ((l * 53) % 70), 11, 5); }
      pop();
    }
    Ex.arrow(FILES.x + 170, FILES.y - 30, SERVER.x - 230, SERVER.y - 30, P(t, c("boot").s - 0.1, 0.35), { bend: -30, weight: 7, seed: 10 });
  },

  server(t) {
    const f = this.f, c = this.cue, tB = c("boot").s;
    const s = this.pop(t, tB - 0.25, 0.35);
    if (s <= 0) return;
    const booting = t > tB && t < tB + 1.3;
    const sh = booting ? Math.sin(t * 70) * 3 : 0;
    const hw = (SERVER.h * 508) / 588;
    Ex.img(this.sp.server, SERVER.x + sh, SERVER.y, SERVER.h * s);
    // LEDs wake up one by one
    [0.23, 0.345, 0.47, 0.6, 0.78].forEach((ry, i) => {
      const on = P(t, tB + 0.15 + i * 0.12, 0.1);
      if (on <= 0 || s < 1) return;
      const blink = 0.6 + 0.4 * Math.sin(t * (9 + i * 3) + i);
      const lx = SERVER.x - hw / 2 + hw * 0.83 + sh, ly = SERVER.y - SERVER.h / 2 + SERVER.h * ry;
      noStroke(); fill(255, 181, 61, 90 * on * blink); circle(lx, ly, 46); fill(255, 214, 120, 255 * on * blink); circle(lx, ly, 16);
    });
    // boot hum rings
    if (booting) for (let k = 0; k < 3; k++) {
      const ph = ((t - tB) * 1.8 + k / 3) % 1;
      noFill(); stroke(255, 181, 61, 150 * (1 - ph)); strokeWeight(5); ellipse(SERVER.x, SERVER.y, hw * (1 + ph * 0.8), SERVER.h * (1 + ph * 0.5));
    }
  },

  terminal(t) {
    const f = this.f, c = this.cue, tB = c("boot").s, tOK = c("OK").s;
    const s = this.pop(t, tB + 0.2, 0.35);
    if (s <= 0) return;
    const ok = P(t, tOK, 0.3);
    // halo + rays on "OK" (angel choir)
    if (ok > 0) {
      push(); translate(TERM.x + TERM.w / 2, TERM.y + TERM.h / 2); rotate(t * 0.25);
      noStroke();
      for (let i = 0; i < 14; i++) { fill(255, 214, 120, 60 * ok); const a = (i / 14) * TWO_PI; triangle(0, 0, Math.cos(a - 0.09) * 900, Math.sin(a - 0.09) * 900, Math.cos(a + 0.09) * 900, Math.sin(a + 0.09) * 900); }
      pop();
    }
    push(); translate(TERM.x + TERM.w / 2, TERM.y + TERM.h / 2); scale(s); translate(-TERM.w / 2, -TERM.h / 2);
    const o = Ex.window(0, 0, TERM.w, TERM.h, { title: "terminal", theme: "terminal", font: f.mono });
    const L1 = "$ curl localhost:3000", L2 = "{\"status\":\"ok\"}";
    const total = L1.length + 1 + L2.length + 1;
    const p1 = P(t, tB + 0.45, 0.8) * (L1.length + 1), p2 = P(t, tOK, 0.35) * (L2.length + 1);
    Ex.code([L1, L2], o.x, o.y + 6, { font: f.code, size: 40, lang: "rb", gutter: false, progress: (p1 + p2) / total, cursor: true });
    // waiting dots while he prays
    if (t > tB + 1.3 && ok <= 0) { fill(Ex.C.codeCom); noStroke(); for (let i = 0; i < 3; i++) if (Math.floor(t * 4) % 4 > i) circle(o.x + 20 + i * 28, o.y + 92, 12); }
    if (ok > 0) {
      const e = ease.outBack(P(t, tOK + 0.3, 0.35));
      push(); translate(TERM.w - 80, TERM.h - 70); scale(e); noStroke(); fill("#28C840"); circle(0, 0, 84);
      stroke("#FFFFFF"); strokeWeight(11); noFill(); strokeCap(ROUND); strokeJoin(ROUND); beginShape(); vertex(-20, 2); vertex(-5, 17); vertex(22, -14); endShape(); pop();
    }
    pop();
    Ex.stamp(t, tOK + 0.45, "FIRST WORKING VERSION", TERM.x + 330, TERM.y + TERM.h - 50, { font: f.title, size: 58, color: Ex.C.amber, rot: -0.07 });
  },

  slots(t) {
    const c = this.cue, tP = c("pray").s - 0.1, tOK = c("OK").s;
    const s = this.pop(t, tP, 0.35);
    if (s <= 0) return;
    const w = (SLOTS.h * 648) / 592, x0 = SLOTS.x - w / 2, y0 = SLOTS.y - SLOTS.h / 2;
    Ex.img(this.sp.slots, SLOTS.x, SLOTS.y, SLOTS.h * s);
    if (s < 1) return;
    // three reels spin, then land ✓ ✓ ✓ on "OK"
    const rx = [0.105, 0.29, 0.475].map((v) => x0 + w * v), rw = w * 0.17, ry0 = y0 + SLOTS.h * 0.29, rh = SLOTS.h * 0.36;
    rx.forEach((x, i) => {
      const stop = tOK + 0.05 + i * 0.14, spinning = t < stop;
      push(); drawingContext.save(); drawingContext.beginPath(); drawingContext.rect(x, ry0, rw, rh); drawingContext.clip();
      const off = spinning ? ((t - tP) * 9 + i * 0.3) % 1 : 0;
      for (let k = -1; k <= 1; k++) {
        const cy = ry0 + rh / 2 + (k + off) * rh * 0.9, cx = x + rw / 2, sz = rw * 0.28;
        const good = !spinning && k === 0;
        const bad = spinning ? (k + i + Math.floor((t - tP) * 9)) % 3 !== 0 : false;
        strokeWeight(9); strokeCap(ROUND); noFill();
        if (good || !bad) { stroke(good ? "#1FA64A" : "#6B8F5A"); beginShape(); vertex(cx - sz, cy); vertex(cx - sz * 0.3, cy + sz * 0.7); vertex(cx + sz, cy - sz * 0.7); endShape(); }
        else { stroke(Ex.C.ruby); line(cx - sz, cy - sz, cx + sz, cy + sz); line(cx - sz, cy + sz, cx + sz, cy - sz); }
      }
      drawingContext.restore(); pop();
    });
  },

  crashArrow(t) {
    const c = this.cue, p = P(t, c("crashes").s, 0.8);
    if (p <= 0) return;
    Ex.burst(t, c("crashes").s, SERVER.x, SERVER.y, { n: 26, color: Ex.C.pink, dist: 380, size: 26, seed: 21, shape: "line" });
    Ex.arrow(SERVER.x - 120, SERVER.y + 260, LOOP.x + LOOP.r * 0.87 + 120, LOOP.y + LOOP.r * 0.5 - 30, p, { bend: -160, weight: 12, seed: 22, color: Ex.C.pink, head: 60 });
  },

  loop(t) {
    const f = this.f, c = this.cue, tT = c("template").s, tRep = c("repair").s;
    // title: the real template file
    Ex.chalk("templates/prompt_fix_error.md", LOOP.x, LOOP.y - LOOP.r - 150, { font: f.mono, size: 58, align: CENTER, color: Ex.C.amber, progress: P(t, tT - 0.2, 0.7) });
    Ex.chalk("(few-shot examples)", LOOP.x - LOOP.r - 330, LOOP.y - 60, { font: f.chalk, size: 40, align: CENTER, progress: P(t, tT + 0.4, 0.5), alpha: 0.8 });
    // gears in the middle spin with the loop
    const gs = this.pop(t, c("code").s, 0.4);
    const spin = Math.max(0, t - c("code").s) * 0.8 + Math.max(0, t - tRep) * 2.2;
    if (gs > 0) this.gears(spin, gs);
    const nodes = [
      { k: "CODE", a: -HALF_PI, w: "code", col: Ex.C.paper, ink: Ex.C.ink },
      { k: "ERROR", a: PI / 6, w: "error", col: Ex.C.pink, ink: "#FFFFFF" },
      { k: "FIX", a: (5 * PI) / 6, w: "fix", col: Ex.C.amber, ink: Ex.C.ink }
    ];
    const pos = nodes.map((n) => [LOOP.x + Math.cos(n.a) * LOOP.r, LOOP.y + Math.sin(n.a) * LOOP.r]);
    // clockwise arrows between the nodes, drawn after "fix."
    for (let i = 0; i < 3; i++) {
      const a0 = nodes[i].a + 0.42, a1 = nodes[(i + 1) % 3].a - 0.42 + (i === 2 ? TWO_PI : 0), pts = [];
      for (let k = 0; k <= 20; k++) { const a = a0 + ((a1 - a0) * k) / 20; pts.push([LOOP.x + Math.cos(a) * LOOP.r, LOOP.y + Math.sin(a) * LOOP.r]); }
      Ex.chalkLine(pts, P(t, c(nodes[(i + 1) % 3].w).s - 0.15 + (i === 2 ? 0.45 : 0), 0.4), { weight: 8, seed: 40 + i, arrow: true, head: 34 });
    }
    // a spark races round the loop, faster once it's a "repair loop"
    if (t > c("fix").e) {
      const ang = -HALF_PI + (t - c("fix").e) * 1.6 + Math.max(0, t - tRep) * 2.6;
      noStroke(); fill(255, 214, 120, 90); circle(LOOP.x + Math.cos(ang) * LOOP.r, LOOP.y + Math.sin(ang) * LOOP.r, 60);
      fill(Ex.C.amber); circle(LOOP.x + Math.cos(ang) * LOOP.r, LOOP.y + Math.sin(ang) * LOOP.r, 24);
    }
    nodes.forEach((n, i) => {
      const e = this.pop(t, c(n.w).s - 0.05, 0.35);
      if (e <= 0) return;
      const [x, y] = pos[i], hot = t > c(n.w).s && t < c(n.w).e + 0.25;
      push(); translate(x, y); scale(e * (hot ? 1.12 : 1));
      drawingContext.shadowColor = "rgba(0,0,0,0.4)"; drawingContext.shadowBlur = 22; drawingContext.shadowOffsetY = 8;
      noStroke(); fill(n.col); rect(-125, -58, 250, 116, 16);
      drawingContext.shadowColor = "transparent";
      fill(n.ink); textFont(f.title); textSize(76); textAlign(CENTER, CENTER); text(n.k, 0, 4);
      pop();
    });
    // "written by hand" scribble
    const hp = P(t, c("written").s, 0.9);
    if (hp > 0) {
      Ex.chalk("the agent loop,", LOOP.x + LOOP.r + 110, LOOP.y - 110, { font: f.hand, size: 56, color: Ex.C.amber, progress: hp * 1.8 });
      Ex.chalk("hand-rolled", LOOP.x + LOOP.r + 150, LOOP.y - 40, { font: f.hand, size: 56, color: Ex.C.amber, progress: hp * 1.8 - 0.8 });
      Ex.chalkLine([[LOOP.x + LOOP.r + 150, LOOP.y - 18], [LOOP.x + LOOP.r + 480, LOOP.y - 12]], P(t, c("hand").s, 0.4), { weight: 5, seed: 50, color: Ex.C.amber });
    }
  },

  // three meshing gears, each on its own axle (w7-gears). `spin` drives the large gear; the others follow the tooth ratio.
  gears(spin, gs) {
    const L = GEAR_LAYOUT;
    push(); translate(LOOP.x, LOOP.y + 10); scale(gs);
    // one soft shared shadow under the cluster (device-space offset, so it never rotates)
    drawingContext.shadowColor = "rgba(0,0,0,0.38)"; drawingContext.shadowBlur = 26; drawingContext.shadowOffsetY = 10;
    for (const g of L) {
      const im = this.sp[g.n];
      if (!im) continue;
      push(); translate(g.x, g.y); rotate(g.phi0 + g.ratio * spin); scale(g.k);
      imageMode(CORNER); image(im, -g.cx, -g.cy, im.width, im.height);   // pivot = measured hub centre, not the crop centre
      pop();
    }
    drawingContext.shadowColor = "transparent"; drawingContext.shadowBlur = 0; drawingContext.shadowOffsetY = 0;
    pop();
  },

  // GPT-3: ping-pong run cycle carried along the diagram; sleeps at the hourglass; orbits the repair loop.
  robot(t) {
    const c = this.cue;
    const tThen = c("Then").s, tSleep = c("Sleep").s, tStitch = c("Stitch").s, tBoot = c("boot").s, tPray = c("pray").s, tOK = c("OK").s;
    const tCode = c("code").s, tRep = c("repair").s;
    if (t < tThen - 0.15) return;
    const path = [
      [tThen - 0.2, SPEC.x - 800, FLOOR], [tThen + 1.2, MACH[0].x + 60, FLOOR], [c("method").s + 0.2, MACH[1].x + 60, FLOOR + 20],
      [c("route").s + 0.2, MACH[2].x + 60, FLOOR + 40], [tSleep + 0.1, HOUR.x + 250, FLOOR], [tStitch, HOUR.x + 250, FLOOR],
      [tBoot, FILES.x + 150, FLOOR], [tPray - 0.2, 5900, 1030], [c("for", 2).s + 0.2, 5900, 1030],
      [tCode - 0.1, ORB.x + Math.cos(ORB.a0) * ORB.rx, ORB.y + Math.sin(ORB.a0) * ORB.ry]
    ];
    const RH = t >= tCode - 0.1 ? 230 : 280, sleeping = t > tSleep + 0.1 && t < tStitch, praying = t > tPray - 0.2 && t < tOK, cheer = t > tOK && t < c("for", 2).s + 0.2;
    let x, y, flip = false, moving = true;
    if (t < tCode - 0.1) {
      let i = 0; while (i < path.length - 2 && t >= path[i + 1][0]) i++;
      const [ta, xa, ya] = path[i], [tb, xb, yb] = path[i + 1];
      const u = clamp01((t - ta) / (tb - ta));
      x = xa + (xb - xa) * u; y = ya + (yb - ya) * u; moving = xb !== xa || yb !== ya; flip = xb < xa;
    } else {
      // orbit the loop clockwise on an ellipse outside the nodes
      const a = ORB.a0 + (t - tCode + 0.1) * 0.9 + Math.max(0, t - tRep) * 1.4;
      x = ORB.x + Math.cos(a) * ORB.rx; y = ORB.y + Math.sin(a) * ORB.ry; flip = Math.sin(a) > 0;
    }
    let fi = Math.floor(t * 24) % 246; if (fi >= 123) fi = 246 - fi;               // ping-pong 0..123
    if (sleeping) fi = 45; else if (praying) fi = 60;
    const im = this.run.frame(fi), b = this.runBox, k = RH / ((b.y1 - b.y0) * im.height);
    const hop = cheer ? -Math.abs(Math.sin((t - tOK) * 9)) * 60 * (1 - P(t, tOK + 1.2, 0.5)) : 0;
    push(); translate(x, y + hop); if (flip) scale(-1, 1);
    imageMode(CORNER); image(im, -((b.x0 + b.x1) / 2) * im.width * k, -b.y1 * im.height * k, im.width * k, im.height * k);
    pop();
    if (sleeping) for (let i = 0; i < 3; i++) {
      const ph = ((t - tSleep) * 0.8 + i / 3) % 1;
      Ex.chalk("z", x + 160 + ph * 140 + i * 10, y - RH - 20 - ph * 160, { font: this.f.chalk, size: 50 + i * 14, alpha: Math.sin(ph * PI) });
    }
    if (moving && !sleeping && !praying && t < tCode) {
      stroke(243, 239, 228, 120); strokeWeight(5); strokeCap(ROUND);
      for (let i = 0; i < 3; i++) { const ly = y - 60 - i * 70, dx = flip ? 1 : -1; line(x + dx * (160 + i * 20), ly, x + dx * (260 + i * 40 + 30 * Math.sin(t * 20 + i)), ly); }
      noStroke();
    }
  },

  // ---------- screen space ----------
  profPuppet(t, cam, camPrev) {
    const c = this.cue, b = this.profBox, im = this.prof;
    const PHt = 500, k = PHt / ((b.y1 - b.y0) * im.height);
    const enter = ease.outCubic(P(t, 0.05, 1.4));
    const vx = (cam.x - camPrev.x) * cam.z / 0.15;                                     // screen px/s of the pan
    const walk = Math.max(1 - enter, clamp01((vx - 40) / 500)) * (t < c("for", 2).s + 0.1 || t > c("template").s + 0.8 ? 1 : 0);
    const x = -380 + (310 + 380) * enter, feet = 1045;
    const bob = -Math.abs(Math.sin(t * PI * 2.4)) * 16 * walk;
    const tap = ["Ruby", "spec", "route", "seconds", "OK", "fix", "hand"].reduce((a, w) => {
      const d = t - c(w).s; return a + (d > 0 && d < 0.5 ? Math.sin((d / 0.5) * PI) : 0);
    }, 0);
    const rock = walk * 0.035 * Math.sin(t * PI * 2.4) - 0.06 * tap;
    push(); translate(x, feet + bob); rotate(rock);
    const breathe = 1 + 0.012 * Math.sin(t * 2.2);
    scale(1 / breathe, breathe);
    imageMode(CORNER); image(im, -((b.x0 + b.x1) / 2) * im.width * k, -b.y1 * im.height * k, im.width * k, im.height * k);
    pop();
  },

  ribbon(t) {
    const f = this.f, c = this.cue;
    const acts = [c("This").s, c("One").s + 0.3, c("Then").s, c("route").s, c("OK").s];
    const show = P(t, 0.3, 0.5) * (1 - P(t, c("for", 2).s + 0.2, 0.4));
    if (show <= 0) return;
    let active = 0; acts.forEach((a, i) => { if (t >= a) active = i; });
    const x0 = 190, x1 = 690, y = 46, n = COMMITS.length;
    push(); drawingContext.globalAlpha *= show;
    noStroke(); fill(16, 21, 34, 200); rect(x0 - 150, y - 30, x1 - x0 + 300, 104, 14);
    textFont(f.tag); textSize(17); fill(Ex.C.amber); textAlign(LEFT, CENTER); text("git log", x0 - 132, y);
    stroke("rgba(243,239,228,0.35)"); strokeWeight(4); line(x0, y, x1, y);
    const flash = 1 - P(t, acts[active], 0.35);
    COMMITS.forEach((cm, i) => {
      const cx = x0 + (i * (x1 - x0)) / (n - 1), on = i === active;
      noStroke();
      if (on) { fill(255, 181, 61, 70 + 120 * flash); circle(cx, y, 38 + 20 * flash); }
      fill(on ? Ex.C.amber : i < active ? Ex.C.chalk : "rgba(243,239,228,0.35)"); circle(cx, y, on ? 20 : 12);
    });
    const cm = COMMITS[active];
    textAlign(CENTER, CENTER); textFont(f.mono); textSize(21);
    const label = [cm.hash === "·······" ? null : cm.hash, cm.date || null, cm.msg].filter(Boolean).join("  ·  ");
    fill(Ex.C.chalk); text(label, (x0 + x1) / 2, y + 40);
    pop();
  },

  prayer(t) {
    const c = this.cue, t0 = c("pray").s - 0.05, t1 = c("OK").s + 0.6;
    if (t < t0 || t > t1 + 0.5) return;
    const up = ease.outBack(P(t, t0, 0.45)), down = ease.inCubic(P(t, t1, 0.45));
    const x = 1780, yb = 1080 + 40 + (1 - up) * 460 + down * 520;
    const g = drawingContext.createRadialGradient(x, yb - 220, 20, x, yb - 220, 330);
    g.addColorStop(0, "rgba(255,221,140,0.6)"); g.addColorStop(1, "rgba(255,221,140,0)");
    push(); drawingContext.fillStyle = g; noStroke(); ellipse(x, yb - 220, 660, 660); pop();
    Ex.img(this.sp.prayer, x, yb, 420, { anchor: "bottom", rot: 0.03 * Math.sin(t * 7) });
    for (let i = 0; i < 5; i++) {
      const a = t * 1.5 + i * 1.26, sx = x + Math.cos(a) * 220, sy = yb - 260 + Math.sin(a) * 120, s = 9 + 5 * Math.sin(t * 8 + i);
      noStroke(); fill(255, 230, 150, 230 * up * (1 - down)); push(); translate(sx, sy); rotate(PI / 4); rect(-s / 2, -s / 2, s, s); pop();
    }
  },

  draw(t) {
    const f = this.f, c = this.cue, K = width / W;
    background(Ex.C.ink);
    const cam = this.cam(t), camPrev = this.cam(Math.max(0, t - 0.15));
    const shake = t > c("OK").s && t < c("OK").s + 0.2 ? [Math.sin(t * 110) * 8 * (1 - (t - c("OK").s) / 0.2), 0] : [0, 0];
    Ex.withCam({ ...cam, z: cam.z * K }, () => {
      if (this.plate) { imageMode(CORNER); image(this.plate, 0, 0, W, H); }
      push(); translate(BOARD.x, OY); scale(SD);
      this.header(t);
      this.crashArrow(t);
      this.mill(t); this.config(t); this.spec(t);
      this.machines(t); this.hourglass(t); this.files(t);
      this.server(t); this.slots(t); this.terminal(t);
      const orbit = t >= c("code").s - 0.1;
      if (orbit) this.robot(t);
      this.loop(t);
      if (!orbit) this.robot(t);
      pop();
    }, shake);
    this.prayer(t);
    this.profPuppet(t, cam, camPrev);
    this.ribbon(t);
    Ex.card(t, c("template").s + 0.8, c("template").s + 3.55, 30 * K, 150 * K, 610 * K, { side: "left", fonts: { tag: f.tag, title: f.title, body: f.bodyR, cite: f.bodyR },
      size: 21 * K, title: "pass@k: praying, quantified",
      body: "Draw n samples, c pass the unit tests. Unbiased estimate that at least one of k passes: pass@k = E[ 1 − C(n−c, k) / C(n, k) ]. The naive 1 − (1 − c/n)^k is biased. Codex-12B, HumanEval: pass@1 = 28.8%.",
      cite: "Chen et al. 2021, Evaluating LLMs Trained on Code · arXiv:2107.03374" });
    Ex.caption(t, this.ph, { font: f.body, size: 34, speakers: { prof: "#FFFFFF" } });
    Ex.vignette(0.3);
  }
});
