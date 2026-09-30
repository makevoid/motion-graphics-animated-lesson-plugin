// s02 lecture title (song 14.25–31.33 s, frames 342–752; t is section-local). Plate = s01/hall, redrawn inside the camera.
// p03 0.51–13.47 prof welcome (H3 prof_title, audio_at 0.3) · c01 13.67–14.55 Claude "Can I help?" (H3 claude_ask, audio_at 13.45)
// · p04 14.66–16.66 "Not yet. Sit down." (H3 prof_notyet, audio_at 14.4) — record-scratch snap zoom, robots zip to the desks.
//
// prof_title was generated with an uncommanded slow push-in (the character grows ≈1.46× over the clip). ZOOM (measured from the
// hair-halo width of the cut-out frames) is cancelled here: each frame is drawn at PROF.s / z about the head anchor (ax, ay), so
// the prof keeps one size on screen and matches prof_notyet (locked, z ≈ 0.985) at the hidden cut on "Not".
const W = 1920, H = 1080;
const BOARD = { x: 237, y: 87, w: 1430, h: 529 };   // chalkboard area on the plate (1920×1080 world units)
const PROF = { ax: 790, ay: 90, x: 390, y: 530, s: 0.84 };   // clip-pixel anchor (ax, ay) pinned at world (x, y); s = world px per clip px
const ZOOM = [[0, 1], [0.5, 1.07], [1, 1.11], [1.5, 1.16], [2.3, 1.21], [4.1, 1.25], [5, 1.29], [6.5, 1.35], [8.5, 1.4], [10, 1.43],
  [12, 1.45], [14.4, 1.46]];
const Z_NOTYET = 0.985;
// Robots: stills/clips are full 16:9 frames (character ≈ 0.93 of the frame height, centred); anchored at the frame bottom.
const CL = { x: 1335, y: 1060, h: 520 }, CX = { x: 1610, y: 1060, h: 540 };
const SEAT = { cl: { x: 1120, y: 1045, h: 345 }, cx: { x: 1350, y: 1045, h: 345 * 0.85 } };   // codex_sit keyframe is drawn ~18% larger
const DESK_Y = 968;   // top of the front-row desks: seated robots sit behind this line

const lerpTab = (tab, x) => {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) if (x < tab[i][0]) {
    const [a, va] = tab[i - 1], [b, vb] = tab[i];
    return va + ((vb - va) * (x - a)) / (b - a);
  }
  return tab[tab.length - 1][1];
};

Anim.sketch({
  async load() {
    this.f = await Anim.fonts({ chalk: "chalk.ttf", mono: "mono.ttf", tag: "din-alt.ttf", title: "din-cond.ttf", body: "body-med.ttf",
      bodyR: "body.ttf" });
    const img = (p) => new Promise((ok) => loadImage(p, ok, () => ok(null)));
    this.plate = await img("/output/s01/02_kf_hall.png");
    this.kb = await img("/output/props-a-v1/sprites/keyboard.png");
    this.title = await Anim.clip("prof_title");
    this.notyet = await Anim.clip("prof_notyet");
    this.ask = await Anim.clip("claude_ask");
    this.clPeek = (await Anim.clip("claude_peek")).frame(0);
    this.clSit = (await Anim.clip("claude_sit")).frame(0);
    this.cxPeek = (await Anim.clip("codex_peek")).frame(0);
    this.cxSit = (await Anim.clip("codex_sit")).frame(0);
    // section words carry no speaker/line: c01 "Can I help?" is Claude's (13.67–14.55)
    this.words = Anim.data("words").map((w) => {
      const claude = w.s >= 13.6 && w.s < 14.6;
      return { ...w, speaker: claude ? "claude" : "prof", line: claude ? "c01" : w.s < 13.6 ? "p03" : "p04" };
    });
    this.cue = Anim.cues(this.words);
    // a phrase leaves before the next one starts (Ex.caption holds a phrase 0.35 s past its end and shows the first match)
    this.ph = Ex.phrases(this.words).map((p, i, a) => (a[i + 1] ? { ...p, e: Math.min(p.e, a[i + 1].s - 0.45) } : p));
  },

  // Professor: prof_title counter-scaled against its push-in, then prof_notyet from "Not" (the cut hides under the snap zoom).
  prof(t, tNot) {
    const late = t >= tNot;
    const clip = late ? this.notyet : this.title;
    const im = clip.at(t);
    if (!im) return;
    const z = late ? Z_NOTYET : lerpTab(ZOOM, t - this.title.audio_at);
    const k = PROF.s / z;
    imageMode(CORNER);
    image(im, PROF.x - PROF.ax * k, PROF.y - PROF.ay * k, im.width * k, im.height * k);
  },

  // A robot that slides in from the right on its cue, freezes on the record scratch, then whip-zips to its seat on "Sit".
  robot(t, o) {
    const { peek, sit, pos, seat, tIn, tSit, clip, tNot, tLean, phase } = o;
    if (t < tIn) return;
    const tt = t >= tNot && t < tSit ? tNot : t;            // record-scratch freeze
    const zip = Anim.clamp01((t - tSit) / 0.3);
    const lean = -0.07 * Anim.ease.outBack(Anim.clamp01((tt - tLean) / 0.5));
    const reach = -28 * Anim.clamp01((tt - tLean) / 0.5);
    if (zip <= 0) {
      const im = clip && tt >= clip.audio_at ? clip.at(tt) : peek;
      return Ex.puppet(im, tt, { ...pos, x: pos.x + reach, t0: tIn, from: "right", tilt: lean, bob: 5, phase, breathe: im === peek ? 0.018 : 0 });
    }
    const e = Anim.ease.inOutCubic(zip);
    const x = pos.x + reach + (seat.x - pos.x - reach) * e, y = pos.y + (seat.y - pos.y) * e, h = pos.h + (seat.h - pos.h) * e;
    if (zip < 1) {
      push(); stroke(Ex.C.chalk); strokeCap(ROUND);
      for (let i = 0; i < 6; i++) {
        strokeWeight(6 - i * 0.6); drawingContext.globalAlpha = 0.85 * (1 - zip * 0.6);
        const ly = y - h * (0.18 + i * 0.13);
        line(x + h * 0.25, ly, x + h * 0.25 + (240 + i * 40) * (1 - zip * 0.5), ly);
      }
      pop();
      Ex.img(peek, x, y, h, { anchor: "bottom", sx: 1.3 - 0.3 * zip, sy: 0.82 + 0.18 * zip });
    } else Ex.puppet(sit, t, { ...seat, t0: tSit + 0.3, from: "pop", bob: 2, speed: 0.6, phase, enterDur: 0.3 });
  },

  keyboard(t, tk, tSit) {
    if (!this.kb || t < tk) return;
    const rise = Anim.ease.outBack(Anim.clamp01((t - tk) / 0.8));
    const drop = Anim.ease.inOutCubic(Anim.clamp01((t - tSit - 0.1) / 0.45));
    const hover = Math.sin((t - tk) * 3) * 10 * (1 - drop);
    const x = 975 + (600 - 975) * drop, y = 830 - 280 * rise + (1010 - 550) * drop + hover;
    const h = 200 - 70 * drop, rot = 0.1 * Math.sin((t - tk) * 2) * (1 - drop) - 0.35 * drop;
    const pulse = 0.85 + 0.15 * Math.sin((t - tk) * 7);
    push();
    // warm amber halo behind (the prop's baked rim glow reads olive on the board)
    const g = drawingContext.createRadialGradient(x, y, 10, x, y, 300);
    g.addColorStop(0, `rgba(255,181,61,${0.55 * pulse * (1 - drop)})`); g.addColorStop(1, "rgba(255,181,61,0)");
    drawingContext.fillStyle = g; noStroke(); ellipse(x, y, 640, 330);
    // amber shadow-glow following the sprite silhouette, twice for strength
    drawingContext.shadowColor = `rgba(255,170,40,${0.95 * (1 - drop * 0.7)})`;
    drawingContext.shadowBlur = 46;
    Ex.img(this.kb, x, y, h, { rot });
    Ex.img(this.kb, x, y, h, { rot });
    drawingContext.shadowColor = "transparent";
    // screen-blend an amber wash over the rim so the olive fringe turns warm
    drawingContext.globalCompositeOperation = "screen";
    const g2 = drawingContext.createRadialGradient(x, y, h * 0.4, x, y, h * 1.1);
    g2.addColorStop(0, "rgba(255,160,40,0)"); g2.addColorStop(1, `rgba(255,160,40,${0.35 * (1 - drop)})`);
    drawingContext.fillStyle = g2; ellipse(x, y, h * 2.2, h * 1.5);
    pop();
    // sparkles while it hovers
    for (let i = 0; i < 6; i++) {
      const a = (t - tk) * 1.3 + i * 1.047, r = 190 + 20 * Math.sin(t * 4 + i);
      const sx = x + Math.cos(a) * r, sy = y + Math.sin(a) * r * 0.45, s = 7 + 4 * Math.sin(t * 9 + i * 2);
      noStroke(); fill(255, 214, 120, 220 * rise * (1 - drop)); push(); translate(sx, sy); rotate(PI / 4); rect(-s / 2, -s / 2, s, s); pop();
    }
  },

  // Plate crop of the front desks redrawn over seated robots so they sit *behind* the desks.
  desks(t, tSit) {
    if (!this.plate || t < tSit + 0.2) return;
    const k = this.plate.width / W, x0 = 880, x1 = 1600;
    imageMode(CORNER);
    image(this.plate, x0, DESK_Y, x1 - x0, H - DESK_Y, x0 * k, DESK_Y * k, (x1 - x0) * k, (H - DESK_Y) * k);
  },

  lowerThird(t, t0, t1, x, y) {
    if (t < t0 || t > t1 + 0.4) return;
    const f = this.f, p = Anim.ease.outCubic(Anim.clamp01((t - t0) / 0.45)) - Anim.ease.inCubic(Anim.clamp01((t - t1) / 0.35));
    push(); translate(x + (1 - p) * 80, y); drawingContext.globalAlpha *= Anim.clamp01(p);
    noStroke(); fill(16, 21, 34, 215); rect(-28, -22, 660, 196, 14); fill(Ex.C.amber); rect(-28, -22, 8, 196, 14, 0, 0, 14);
    textAlign(LEFT, TOP); textFont(f.tag); textSize(24);
    const tag = "YOUR LECTURER", tw = Ex.tw(tag) + 26; fill(Ex.C.amber); rect(0, 0, tw, 36, 5); fill(Ex.C.ink); Ex.text(tag, 13, 6);
    textFont(f.title); textSize(76); fill(Ex.C.chalk); Ex.text("Prof. Otto Regress", 0, 44);
    textFont(f.bodyR); textSize(27); fill(243, 239, 228, 210); Ex.text("Dept. of Autoregression · Software Archaeology", 2, 132);
    pop();
  },

  draw(t) {
    const f = this.f, c = this.cue, K = width / W;
    const tNot = c("Not").s, tSit = c("Sit").s, tCl = c("Claude").s, tCx = c("Codex...").s, tHold = c("hold").s;
    const tBefore3 = c("before", 3).s, tKb = c("keyboard.").s, tCan = c("Can").s;
    background(Ex.C.ink);
    // slow push on the prof; snap zooms on "Claude" and "Codex"; pull back for the card; push on the keyboard; hard snap on "Not yet"
    // (every key keeps the plate edges out of frame: |x - 960| <= 960 - 960/z, |y - 540| <= 540 - 540/z)
    const cam = Ex.cam(t, [
      { t: 0, x: 944, y: 545, z: 1.03 },   // = s01 end camera (940–948, 544–546, z 1.03): no jump at the join
      { t: tCl - 0.01, x: 905, y: 560, z: 1.07, ease: "linear" },
      { t: tCl + 0.18, x: 1150, y: 650, z: 1.28, ease: "outExpo" },
      { t: tCx - 0.01, x: 1155, y: 652, z: 1.285, ease: "linear" },
      { t: tCx + 0.18, x: 1175, y: 660, z: 1.33, ease: "outExpo" },
      { t: tBefore3, x: 1178, y: 661, z: 1.34, ease: "linear" },
      { t: tBefore3 + 0.6, x: 960, y: 545, z: 1.03, ease: "inOutCubic" },
      { t: tHold, x: 975, y: 548, z: 1.05, ease: "linear" },
      { t: tHold + 0.5, x: 1000, y: 565, z: 1.12, ease: "outCubic" },
      { t: tCan, x: 1030, y: 572, z: 1.14, ease: "linear" },
      { t: tNot - 0.01, x: 1036, y: 575, z: 1.15, ease: "linear" },
      { t: tNot + 0.12, x: 610, y: 700, z: 1.6, ease: "outExpo" },
      { t: tSit - 0.04, x: 616, y: 702, z: 1.63, ease: "linear" },
      { t: tSit + 0.55, x: 960, y: 545, z: 1.03, ease: "outCubic" },
      { t: 17.08, x: 950, y: 548, z: 1.05, ease: "linear" }
    ]);
    const shake = t > tNot && t < tNot + 0.22 ? [Math.sin(t * 120) * 11 * (1 - (t - tNot) / 0.22), 0] : [0, 0];
    Ex.withCam({ ...cam, z: cam.z * K }, () => {
      if (this.plate) { imageMode(CORNER); image(this.plate, 0, 0, W, H); }
      // chalk title writes across the board during "Good morning … archaeology", then an underline
      Ex.chalk("SOFTWARE ARCHAEOLOGY 101", BOARD.x + BOARD.w / 2, BOARD.y + 108,
        { font: f.chalk, size: 62, align: CENTER, progress: (t - c("Good").s) / (c("archaeology:").e - c("Good").s) });
      Ex.chalkLine([[BOARD.x + 190, BOARD.y + 138], [BOARD.x + BOARD.w - 190, BOARD.y + 142]], (t - c("archaeology:").e) / 0.5, { weight: 5, seed: 4 });
      // the two eras, left of the robots and above the prof's head
      Ex.chalk("2022: you hold the keyboard", BOARD.x + 235, BOARD.y + 232, { font: f.chalk, size: 40, progress: (t - c("how").s) / 1.3 });
      Ex.chalk("2025: the model holds it", BOARD.x + 235, BOARD.y + 306, { font: f.chalk, size: 40, progress: (t - tHold) / 0.9, color: Ex.C.amber });
      if (t > tHold + 0.9) Ex.chalkLine([[BOARD.x + 215, BOARD.y + 240], [BOARD.x + 185, BOARD.y + 272], [BOARD.x + 215, BOARD.y + 298]], (t - tHold - 0.9) / 0.35, { weight: 4, seed: 9, arrow: true, head: 16 });
      // robots (Codex behind Claude), then the desk row over the seated ones
      this.robot(t, { peek: this.cxPeek, sit: this.cxSit, pos: CX, seat: SEAT.cx, tIn: tCx, tSit: tSit + 0.12, clip: null, tNot, tLean: tHold + 0.1, phase: 0.4 });
      this.robot(t, { peek: this.clPeek, sit: this.clSit, pos: CL, seat: SEAT.cl, tIn: tCl, tSit, clip: this.ask, tNot, tLean: tHold, phase: 0 });
      this.desks(t, tSit);
      Ex.stamp(t, tCl + 0.3, "ETA 2025", CL.x - 20, CL.y - CL.h - 22, { font: f.title, size: 60, color: Ex.C.amber, rot: -0.14, t1: tSit });
      Ex.stamp(t, tCx + 0.3, "ETA 2025", CX.x + 10, CX.y - CX.h - 8, { font: f.title, size: 60, color: Ex.C.pink, rot: 0.1, t1: tSit + 0.12 });
      // the keyboard floats up on "hold the keyboard", then is yanked back to the prof on "Sit"
      if (t < tSit + 0.1) this.keyboard(t, tHold, tSit);
      this.prof(t, tNot);
      if (t >= tSit + 0.1) this.keyboard(t, tHold, tSit);
    }, shake);
    // record scratch on "Not": desaturated freeze while he says "Not yet.", scratch lines + flash on the hit
    const frz = Anim.clamp01((t - tNot) / 0.06) * (1 - Anim.clamp01((t - tSit + 0.1) / 0.25));
    if (frz > 0) {
      push(); drawingContext.globalCompositeOperation = "saturation"; noStroke(); fill(128, 128, 128, 255 * 0.55 * frz); rect(0, 0, width, height); pop();
    }
    const fr = Anim.clamp01(1 - Math.abs(t - tNot - 0.1) / 0.3);
    if (fr > 0) {
      noStroke(); fill(255, 255, 255, 70 * fr * fr); rect(0, 0, width, height);
      stroke(255, 255, 255, 190 * fr); strokeWeight(3 * K);
      for (let i = 0; i < 7; i++) { const y = height * (0.14 + i * 0.12); line(0, y, width, y + (i % 2 ? 8 : -8) * K); }
      noStroke();
    }
    this.lowerThird(t, c("I'm").s, c("software").s + 2.2, 1130, 740);
    Ex.card(t, tBefore3 + 0.35, tNot - 0.45, width - 628 * K, 200 * K, 600 * K, { fonts: { tag: f.tag, title: f.title, body: f.bodyR, cite: f.bodyR },
      size: 20 * K, title: "Agent = a policy that acts",
      body: "π(a | context): pick an action (edit, run, test), observe the result, repeat. In 2022 the model had exactly one action: emit text.",
      cite: "Yao et al., ReAct (2022) · arXiv:2210.03629" });
    Ex.caption(t, this.ph, { font: f.body, size: 34, speakers: { prof: "#FFFFFF", claude: Ex.C.claude } });
    Ex.vignette(0.32);
  }
});
