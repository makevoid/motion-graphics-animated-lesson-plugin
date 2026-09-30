// s07 agents (song 137.125–156.708 s, frames 3291–3761; t is section-local, 0–19.583). Plate = s07/lab (1920×1080 world units).
// p13 0.475–12.875 prof VO "Today, the loop runs itself … Think. Act. Observe. Repeat."
// cl01 13.065–16.585 Claude "Three tests failing. Fixing the migration." (H3 claude_fix, audio_at 12.82)
// cx01 16.615–19.415 Codex "Patch ready. Opening a pull request." (H3 codex_pr, audio_at 16.36)
//
// Entry: s06's overlay did not exist when this was written, so the scene opens on a clean white flash-in that becomes two
// sliding light doors (night desk → bright lab). Payoff of s02's "Not yet": the glowing keyboard descends, "Not yet." is struck
// out, NOW, and it splits into both robots' hands (Claude's keyboard; Codex's cloud backpack).
//
// claude_fix pushes in by ≈1.5× (full body → head-and-chest). It is NOT counter-scaled: it plays inside a split-screen "agent
// session" window whose viewport is exactly the clip frame, so the H3 crop edges coincide with the window edges and the drift reads
// as a push-in on the speaker; the plate inside the viewport is pushed in with the measured zoom (ZOOM_CL) so both move together.
const W = 1920, H = 1080;
// terminal-wall panels on the plate (measured): left/right x, top y at left/right, bottom y at left/right
const PANELS = [
  { x0: 80, x1: 336, yt0: 146, yt1: 186, yb0: 464, yb1: 456 },
  { x0: 358, x1: 652, yt0: 190, yt1: 200, yb0: 454, yb1: 452 },
  { x0: 678, x1: 1242, yt0: 202, yt1: 202, yb0: 448, yb1: 448 },
  { x0: 1268, x1: 1562, yt0: 200, yt1: 190, yb0: 452, yb1: 454 },
  { x0: 1584, x1: 1840, yt0: 186, yt1: 146, yb0: 456, yb1: 464 }
];
const CL = { x: 520, y: 1010, h: 560 }, CX = { x: 1400, y: 1010, h: 560 };   // full clip frames, bottom-anchored, in world units
const KB_CL = { x: 606, y: 817, h: 180 };                                      // keyboard in the claude_type still
const PACK = { x: 1497, y: 718 };                                              // cloud backpack in the codex_snap still
const TOMB = { x: 1390, y: 1012 };
const ZOOM_CL = [[0, 1], [0.5, 1.12], [1, 1.22], [1.5, 1.29], [2, 1.34], [3, 1.36], [3.5, 1.39], [4, 1.44], [4.5, 1.49], [5.2, 1.5]];
const ZOOM_CX = [[0, 1], [2, 1.05], [5.2, 1.08]];
const INDIGO = "#5B6CFF", INDIGO_L = "#9AA5FF", RED = "#FF5C6A", GREEN = "#4ADE80";
const lerpTab = (tab, x) => {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) if (x < tab[i][0]) {
    const [a, va] = tab[i - 1], [b, vb] = tab[i];
    return va + ((vb - va) * (x - a)) / (b - a);
  }
  return tab[tab.length - 1][1];
};
const C01 = Anim.clamp01, E = Anim.ease;

Anim.sketch({
  async load() {
    this.f = await Anim.fonts({ mono: "mono.ttf", code: "mono-andale.ttf", tag: "din-alt.ttf", title: "din-cond.ttf", body: "body-med.ttf", bodyR: "body.ttf",
      black: "body-black.ttf", hand: "hand.ttf", math: "math.otf", mathI: "math-it.otf" });
    const img = (p) => new Promise((ok) => loadImage(p, ok, () => ok(null)));
    this.plate = await img("/output/s07/02_kf_lab.png");
    this.kb = await img("/output/props-a-v1/sprites/keyboard.png");
    this.fix = await Anim.clip("claude_fix");
    this.pr = await Anim.clip("codex_pr");
    this.clStill = (await Anim.clip("claude_type")).frame(0);
    this.cxStill = (await Anim.clip("codex_snap")).frame(0);
    this.words = Anim.data("words").map((w) => {
      const sp = w.s >= 16.6 ? "codex" : w.s >= 13.0 ? "claude" : "prof";
      return { ...w, speaker: sp, line: { prof: "p13", claude: "cl01", codex: "cx01" }[sp] };
    });
    this.cue = Anim.cues(this.words);
    this.ph = Ex.phrases(this.words).map((p, i, a) => (a[i + 1] ? { ...p, e: Math.min(p.e, a[i + 1].s - 0.45) } : p));
  },

  // ---------- small helpers ----------
  txt(str, x, y, { font, size, color = "#fff", align = LEFT, alpha = 1, base = BASELINE } = {}) {
    push(); textFont(font); textSize(size); noStroke(); fill(color); textAlign(LEFT, base);
    drawingContext.globalAlpha *= alpha;
    const w = Ex.tw(str);
    Ex.text(str, align === CENTER ? x - w / 2 : align === RIGHT ? x - w : x, y);
    pop();
    return w;
  },
  check(x, y, s, color, p = 1) {   // hand-drawn check mark, s = size
    if (p <= 0) return;
    push(); noFill(); stroke(color); strokeWeight(s * 0.18); strokeCap(ROUND); strokeJoin(ROUND);
    const a = [x - s * 0.4, y], b = [x - s * 0.1, y + s * 0.3], c = [x + s * 0.45, y - s * 0.35];
    const q = Math.min(1, p * 2), r = C01(p * 2 - 1);
    line(a[0], a[1], a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q);
    if (r > 0) line(b[0], b[1], b[0] + (c[0] - b[0]) * r, b[1] + (c[1] - b[1]) * r);
    pop();
  },
  cross(x, y, s, color) {
    push(); stroke(color); strokeWeight(s * 0.18); strokeCap(ROUND);
    line(x - s * 0.35, y - s * 0.35, x + s * 0.35, y + s * 0.35); line(x + s * 0.35, y - s * 0.35, x - s * 0.35, y + s * 0.35); pop();
  },
  cloud(x, y, s, col, alpha = 1) {
    push(); noStroke(); fill(col); drawingContext.globalAlpha *= alpha;
    ellipse(x - s * 0.32, y + s * 0.08, s * 0.55, s * 0.42); ellipse(x + s * 0.3, y + s * 0.08, s * 0.6, s * 0.46);
    ellipse(x, y - s * 0.1, s * 0.62, s * 0.58); rect(x - s * 0.55, y + s * 0.02, s * 1.1, s * 0.27, s * 0.13);
    pop();
  },
  loopIcon(x, y, r, a0, color, w = 6) {   // circular arrow
    push(); noFill(); stroke(color); strokeWeight(w); strokeCap(ROUND);
    arc(x, y, r * 2, r * 2, a0, a0 + PI * 1.6);
    const ae = a0 + PI * 1.6, ex = x + Math.cos(ae) * r, ey = y + Math.sin(ae) * r, tx = -Math.sin(ae), ty = Math.cos(ae);
    fill(color); noStroke();
    triangle(ex + tx * r * 0.42, ey + ty * r * 0.42, ex + Math.cos(ae) * r * 0.3, ey + Math.sin(ae) * r * 0.3,
      ex - Math.cos(ae) * r * 0.3, ey - Math.sin(ae) * r * 0.3);
    pop();
  },
  kbSprite(x, y, h, { rot = 0, alpha = 1, glow = 1, t = 0 } = {}) {
    if (!this.kb || alpha <= 0) return;
    push(); drawingContext.globalAlpha *= alpha;
    const g = drawingContext.createRadialGradient(x, y, 8, x, y, h * 1.6);
    g.addColorStop(0, `rgba(255,181,61,${0.5 * glow})`); g.addColorStop(1, "rgba(255,181,61,0)");
    drawingContext.fillStyle = g; noStroke(); ellipse(x, y, h * 3.4, h * 1.9);
    drawingContext.shadowColor = `rgba(255,170,40,${0.9 * glow})`; drawingContext.shadowBlur = 30 * glow;
    Ex.img(this.kb, x, y, h, { rot });
    drawingContext.shadowColor = "transparent";
    pop();
    for (let i = 0; i < 5 && glow > 0.3; i++) {
      const a = t * 1.4 + i * 1.257, r = h * 1.15, sx = x + Math.cos(a) * r, sy = y + Math.sin(a) * r * 0.5, s = 6 + 3 * Math.sin(t * 9 + i);
      push(); noStroke(); fill(255, 214, 120, 210 * alpha * glow); translate(sx, sy); rotate(PI / 4); rect(-s / 2, -s / 2, s, s); pop();
    }
  },

  // typed monospace lines via txt (Ex.code drops lone "." tokens, e.g. users.py → userspy)
  typedLines(arr, x, y, { font, size, lineH = 1.5, progress = 1, color = "#E6E1CF", colors = [] } = {}) {
    const total = arr.reduce((n, s) => n + s.length, 0);
    let left = Math.floor(C01(progress) * total);
    arr.forEach((s, i) => {
      if (left <= 0) return;
      const shown = s.slice(0, left); left -= s.length;
      this.txt(shown, x, y + i * size * lineH, { font, size, color: colors[i] || color });
    });
  },
  bez(p0, segs, col) {   // filled cubic-bezier path via the canvas API (p5 2.x bezierVertex takes one point per call)
    const g = drawingContext; g.beginPath(); g.moveTo(...p0); segs.forEach((s) => g.bezierCurveTo(...s)); g.closePath();
    g.fillStyle = col; g.fill();
  },
  // ---------- terminal wall ----------
  // Runs fn(w, h) inside panel i in panel-local coords (sheared to follow the curved wall), clipped to the panel.
  inPanel(i, fn) {
    const P = PANELS[i], w = P.x1 - P.x0, h = Math.min(P.yb0 - P.yt0, P.yb1 - P.yt1);
    push();
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.moveTo(P.x0 + 4, P.yt0 + 4); drawingContext.lineTo(P.x1 - 4, P.yt1 + 4);
    drawingContext.lineTo(P.x1 - 4, P.yb1 - 4); drawingContext.lineTo(P.x0 + 4, P.yb0 - 4); drawingContext.closePath();
    drawingContext.clip();
    applyMatrix(1, (P.yt1 - P.yt0) / w, 0, 1, P.x0, P.yt0);
    fn(w, h);
    drawingContext.restore();
    pop();
  },
  // CRT power-on: a bright line that opens vertically, then a faint screen glow.
  powerOn(i, t, t0, tint = "rgba(255,181,61,") {
    const p = (t - t0) / 0.35;
    if (p < 0) return 0;
    this.inPanel(i, (w, h) => {
      noStroke();
      fill(22, 26, 36, 235); rect(0, 0, w, h);
      const g = drawingContext.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, tint + "0.10)"); g.addColorStop(1, tint + "0.02)");
      drawingContext.fillStyle = g; rect(0, 0, w, h);
      if (p < 1) {
        const hh = h * E.outCubic(p);
        fill(255, 245, 220, 200 * (1 - p)); rect(0, h / 2 - hh / 2, w, Math.max(3, hh));
      }
    });
    return C01(p);
  },
  wall(t, c) {
    const f = this.f;
    const tOn = c("Today,").s;
    // P3 (centre): the loop that runs itself, before the scoreboard and the ReAct diagram take over
    const onC = this.powerOn(2, t, tOn + 0.05);
    const tScore = c("run").s + 0.35, tThink = c("Think.").s;
    if (onC > 0 && t < tScore + 0.3) {
      const a = 1 - C01((t - tScore) / 0.3);
      this.inPanel(2, (w, h) => {
        push(); drawingContext.globalAlpha *= a;
        this.txt("agent_loop.py", 26, 38, { font: f.tag, size: 20, color: "rgba(230,225,207,0.55)" });
        Ex.code(["while tests_fail():", "    think()", "    act()  # edit, run, test", "    observe()"], 26, 62,
          { font: f.code, size: 21, lang: "py", progress: (t - tOn - 0.3) / 1.6, cursor: false, gutter: false, lineH: 1.4 });
        const spin = t < c("loop").s ? 0 : (t - c("loop").s) * 4.2;
        this.loopIcon(w - 110, h / 2 + 6, 58, spin, Ex.C.amber, 9);
        this.txt("autopilot", w - 110, h / 2 + 100, { font: f.tag, size: 18, color: Ex.C.amber, align: CENTER, alpha: C01((t - c("itself.").s) / 0.3) });
        pop();
      });
    }
    // P1 read the repository · P2 run the tests · P4 read the errors · P5 fix them (each lights on its word)
    const t1 = c("read").s, t2 = c("run").s, t4 = c("read", 2).s, t5 = c("fix").s;
    if (this.powerOn(0, t, t1) > 0) this.inPanel(0, (w, h) => {
      this.txt("READ  repo", 18, 34, { font: f.tag, size: 19, color: Ex.C.amber });
      this.typedLines(["notes-app/", " api/routes/users.py", " alembic/versions/", " tests/test_users.py", " web/src/App.tsx"], 14, 66,
        { font: f.mono, size: 16, lineH: 1.5, progress: (t - t1 - 0.1) / 0.8 });
      const hl = Math.floor(C01((t - t1 - 0.9) / 2) * 5);
      if (t > t1 + 0.9) { noStroke(); fill(255, 181, 61, 40); rect(8, 66 + (1 + (hl % 4)) * 24 - 18, w - 16, 24, 4); }
    });
    if (this.powerOn(1, t, t2) > 0) this.inPanel(1, (w, h) => {
      this.txt("RUN  tests", 18, 34, { font: f.tag, size: 19, color: Ex.C.amber });
      this.typedLines(["$ pytest", "tests/test_users.py"], 14, 72, { font: f.mono, size: 17, lineH: 1.8, progress: (t - t2 - 0.05) / 0.5 });
      for (let k = 0; k < 3; k++) if (t > t2 + 0.6 + k * 0.18) this.txt("F", 220 + k * 11, 103, { font: f.mono, size: 17, color: RED });
      if (t > t2 + 1.2) { noStroke(); fill(255, 92, 106, 50); rect(10, 130, w - 20, 34, 5); this.txt("3 failed", w / 2, 153, { font: f.mono, size: 18, color: RED, align: CENTER }); }
    });
    if (this.powerOn(3, t, t4, "rgba(255,92,106,") > 0) this.inPanel(3, (w, h) => {
      this.txt("READ  errors", 18, 34, { font: f.tag, size: 19, color: RED });
      this.typedLines(["Traceback (most recent call last):", '  File "api/routes/users.py"', "E   AssertionError", "FAILED tests/test_users.py"], 14, 68,
        { font: f.mono, size: 14, lineH: 1.7, progress: (t - t4 - 0.05) / 0.7, colors: [null, null, RED, RED] });
      const bl = 0.5 + 0.5 * Math.sin(t * 10);
      noFill(); stroke(255, 92, 106, 120 * bl); strokeWeight(3); rect(6, 6, w - 12, h - 12, 8);
    });
    if (this.powerOn(4, t, t5, "rgba(74,222,128,") > 0) this.inPanel(4, (w, h) => {
      this.txt("FIX  it", 18, 34, { font: f.tag, size: 19, color: GREEN });
      const p = (t - t5 - 0.05) / 0.7;
      this.txt("~ alembic migration", 14, 72, { font: f.mono, size: 14, color: "rgba(230,225,207,0.7)", alpha: C01(p * 3) });
      noStroke();
      if (p > 0.3) { fill(255, 92, 106, 45); rect(8, 88, w - 16, 26, 3); this.txt("- nullable=False", 16, 107, { font: f.mono, size: 15, color: RED }); }
      if (p > 0.65) { fill(74, 222, 128, 45); rect(8, 118, w - 16, 26, 3); this.txt("+ nullable=True", 16, 137, { font: f.mono, size: 15, color: GREEN }); }
      if (t > tThink - 0.2) { this.check(40, 185, 26, GREEN, (t - tThink + 0.2) / 0.4); this.txt("3 passed", 64, 193, { font: f.mono, size: 17, color: GREEN }); }
    });
    // P3: SWE-bench scoreboard (6.5–9.5), then the ReAct loop (Think. Act. Observe. Repeat.)
    if (t >= tScore && t < tThink - 0.1) this.scoreboard(t, tScore, tThink, c);
    if (t >= tThink - 0.15) this.react(t, c);
  },

  scoreboard(t, t0, t1, c) {
    const f = this.f, a = C01((t - t0) / 0.3) * (1 - C01((t - t1 + 0.4) / 0.25));
    const rows = [
      { d: "Oct 2023", m: "Claude 2", v: 1.96, dp: 2, t: t0 + 0.3 },
      { d: "Feb 2025", m: "Claude 3.7 Sonnet", v: 63.7, dp: 1, t: t0 + 1.0 },
      { d: "May 2025", m: "Claude Sonnet 4", v: 72.7, dp: 1, t: t0 + 1.7 }
    ];
    this.inPanel(2, (w, h) => {
      push(); drawingContext.globalAlpha *= a;
      this.txt("SWE-bench · real GitHub issues resolved", 24, 36, { font: f.tag, size: 22, color: "#FFFFFF" });
      noStroke(); fill(255, 181, 61); rect(24, 44, 64, 3);
      const bx = 262, bw = 200;
      rows.forEach((r, i) => {
        const y = 78 + i * 46, p = C01((t - r.t) / 0.7), e = E.outExpo(p);
        if (t < r.t) return;
        this.txt(r.d, 24, y + 20, { font: f.mono, size: 15, color: "rgba(230,225,207,0.6)" });
        this.txt(r.m, 110, y + 20, { font: f.body, size: 17, color: "#FFFFFF" });
        noStroke(); fill(255, 255, 255, 18); rect(bx, y + 4, bw, 22, 4);
        fill(i === 0 ? Ex.C.pink : Ex.C.claude); rect(bx, y + 4, Math.max(3, bw * (r.v / 100) * e), 22, 4);
        const v = (r.v * e).toFixed(r.dp) + "%";
        this.txt(v, bx + bw + 12, y + 22, { font: f.title, size: 26, color: i === 2 ? Ex.C.amber : "#FFFFFF" });
      });
      this.txt("1.96%: SWE-bench, 2,294 tasks (Jimenez et al., arXiv:2310.06770). 63.7%, 72.7%: SWE-bench Verified,", 24, h - 30,
        { font: f.bodyR, size: 12, color: "rgba(230,225,207,0.62)" });
      this.txt("500 tasks (anthropic.com). Different scaffolds: not strictly comparable.", 24, h - 14,
        { font: f.bodyR, size: 12, color: "rgba(230,225,207,0.62)" });
      pop();
    });
  },

  react(t, c) {
    const f = this.f, tT = c("Think.").s, tA = c("Act.").s, tO = c("Observe.").s, tR = c("Repeat.").s;
    const a = C01((t - tT + 0.15) / 0.25);
    this.inPanel(2, (w, h) => {
      push(); drawingContext.globalAlpha *= a;
      const cx = w / 2, cy = h / 2 + 4, R = 88;
      const spin = t < tR ? 0 : TWO_PI * E.outCubic(C01((t - tR) / 0.75)) + Math.max(0, t - tR - 0.75) * 2.4;
      const nodes = [
        { k: "THINK", t: tT, ang: -HALF_PI, sub: "tests fail on /users", col: Ex.C.phd },
        { k: "ACT", t: tA, ang: -HALF_PI + TWO_PI / 3, sub: "pytest -x", col: Ex.C.amber },
        { k: "OBSERVE", t: tO, ang: -HALF_PI + (2 * TWO_PI) / 3, sub: "FAILED test_users.py", col: RED }
      ];
      // ring with arrowheads
      noFill(); stroke(255, 255, 255, 60); strokeWeight(4); circle(cx, cy, R * 2);
      nodes.forEach((n, i) => {
        const on = t >= n.t, a0 = n.ang + spin + 0.42, a1 = nodes[(i + 1) % 3].ang + spin - 0.42;
        const lit = on && t >= nodes[(i + 1) % 3].t - 0.05;
        stroke(lit ? Ex.C.amber : "rgba(255,255,255,0.35)"); strokeWeight(5); noFill();
        arc(cx, cy, R * 2, R * 2, a0, a1 < a0 ? a1 + TWO_PI : a1);
        const ex = cx + Math.cos(a1) * R, ey = cy + Math.sin(a1) * R, tx = -Math.sin(a1), ty = Math.cos(a1);
        noStroke(); fill(lit ? Ex.C.amber : "rgba(255,255,255,0.35)");
        triangle(ex + tx * 12, ey + ty * 12, ex + Math.cos(a1) * 8 - tx * 2, ey + Math.sin(a1) * 8 - ty * 2, ex - Math.cos(a1) * 8 - tx * 2, ey - Math.sin(a1) * 8 - ty * 2);
      });
      nodes.forEach((n) => {
        const on = t >= n.t, pop_ = on ? E.outBack(C01((t - n.t) / 0.3)) : 0;
        const x = cx + Math.cos(n.ang + spin) * R, y = cy + Math.sin(n.ang + spin) * R;
        const active = on && (t < n.t + 0.8 || t >= tR);
        if (active) { noStroke(); fill(n.col); drawingContext.globalAlpha *= 0.3; circle(x, y, 96 + 10 * Math.sin(t * 9)); drawingContext.globalAlpha /= 0.3; }
        stroke(on ? n.col : "rgba(255,255,255,0.3)"); strokeWeight(4); fill(on ? "#1B1A22" : "#141821");
        circle(x, y, 66 * (0.85 + 0.15 * pop_));
        this.txt(n.k, x, y + 7, { font: f.title, size: n.k.length > 5 ? 17 : 21, color: on ? "#FFFFFF" : "rgba(255,255,255,0.4)", align: CENTER });
      });
      // what the agent is doing at each step (stays put while the ring spins)
      const subs = [[nodes[0], w / 2 + 62, 34, LEFT], [nodes[1], w - 22, h - 20, RIGHT], [nodes[2], 22, h - 20, LEFT]];
      subs.forEach(([n, x, y, al]) => {
        if (t < n.t) return;
        const col = n.k === "OBSERVE" ? RED : n.k === "ACT" ? Ex.C.amber : "#C9BDFF";
        this.txt(n.k === "THINK" ? "“" + n.sub + "”" : n.sub, x, y, { font: n.k === "THINK" ? f.bodyR : f.mono, size: 17, color: col, align: al, alpha: C01((t - n.t) / 0.25) * (1 - C01((t - tR) / 0.2)) });
      });
      if (t >= tR) {
        const k = E.outBack(C01((t - tR) / 0.35));
        push(); translate(cx, cy); scale(k);
        this.txt("REPEAT", 0, 8, { font: f.title, size: 26, color: Ex.C.amber, align: CENTER });
        pop();
        const n = 1 + Math.floor(Math.max(0, t - tR) * 3.5);
        this.txt("loop ×" + n, 22, 34, { font: f.mono, size: 18, color: Ex.C.amber });
      }
      pop();
    });
  },

  // ---------- floor gags ----------
  tombstone(t, t0, tBoom) {
    if (t < t0 || t > tBoom + 0.05) return;
    const f = this.f, rise = E.outBack(C01((t - t0) / 0.4)), shake = t > tBoom - 0.35 ? Math.sin(t * 90) * 4 : 0;
    const w = 250, h = 330, x = TOMB.x + shake, y = TOMB.y + (1 - rise) * 200;
    push();
    drawingContext.save(); drawingContext.beginPath(); drawingContext.rect(x - 200, 0, 400, TOMB.y); drawingContext.clip();
    stroke(Ex.C.ink); strokeWeight(5); fill("#B9B3A6");
    beginShape(); vertex(x - w / 2, y); vertex(x - w / 2, y - h + w / 2);
    for (let i = 0; i <= 20; i++) { const a = PI + (i / 20) * PI; vertex(x + Math.cos(a) * w / 2, y - h + w / 2 + Math.sin(a) * w / 2); }
    vertex(x + w / 2, y); endShape(CLOSE);
    noStroke(); fill(255, 255, 255, 40); rect(x - w / 2 + 14, y - h + w / 2, 14, h - w / 2 - 10, 6);
    this.txt("R.I.P.", x, y - h + 72, { font: f.title, size: 46, color: "#4A4640", align: CENTER });
    this.txt("code-davinci-002", x, y - h + 124, { font: f.mono, size: 21, color: "#2A2724", align: CENTER });
    this.txt("2022 – 2023", x, y - h + 166, { font: f.title, size: 34, color: "#4A4640", align: CENTER });
    this.txt("shut down 23 Mar 2023", x, y - h + 204, { font: f.body, size: 16, color: "#4A4640", align: CENTER });
    this.txt("(3 days' notice)", x, y - h + 226, { font: f.bodyR, size: 15, color: "#5E5850", align: CENTER });
    if (t > tBoom - 0.35) {   // cracks
      const p = C01((t - tBoom + 0.35) / 0.3);
      Ex.chalkLine([[x - 20, y - h + 20], [x + 6, y - h + 90], [x - 18, y - h + 150], [x + 14, y - h + 240]], p, { color: Ex.C.ink, weight: 4, seed: 3 });
    }
    drawingContext.restore();
    pop();
    // dust puff on arrival
    Ex.burst(t, t0 + 0.05, x, TOMB.y - 10, { n: 14, color: "rgba(214,200,176,0.9)", dur: 0.6, dist: 150, size: 16, seed: 8 });
  },
  phoenix(t, t0) {
    if (t < t0 - 0.02 || t > t0 + 1.3) return;
    const f = this.f, p = C01((t - t0) / 1.1), fade = 1 - C01((t - t0 - 0.7) / 0.5);
    Ex.burst(t, t0, TOMB.x, TOMB.y - 170, { n: 16, color: "#8E887C", dur: 0.7, dist: 330, size: 22, seed: 12 });
    Ex.burst(t, t0, TOMB.x, TOMB.y - 170, { n: 26, color: Ex.C.amber, dur: 0.8, dist: 380, size: 12, seed: 13, shape: "line" });
    // a stylised phoenix: flame body + two sweeping wings, rising and fading into the robot
    const x = TOMB.x, y = TOMB.y - 190 - 260 * E.outCubic(p), s = 1 + 0.25 * p, flap = Math.sin(t * 14) * 0.25;
    push(); translate(x, y); scale(s); drawingContext.globalAlpha *= fade * (1 - 0.5 * p);
    const g = drawingContext.createRadialGradient(0, 0, 10, 0, 0, 230);
    g.addColorStop(0, "rgba(255,214,120,0.95)"); g.addColorStop(0.5, "rgba(255,140,60,0.55)"); g.addColorStop(1, "rgba(91,108,255,0)");
    drawingContext.fillStyle = g; noStroke(); circle(0, 0, 460);
    for (const side of [-1, 1]) {
      push(); scale(side, 1); rotate(-flap);
      fill(255, 181, 61, 235);
      this.bez([0, -10], [[80, -120, 190, -150, 250, -90], [190, -80, 160, -40, 200, -10], [140, -20, 110, 10, 130, 40], [70, 20, 30, 20, 0, 30]], "rgba(255,181,61,0.92)");
      fill(91, 108, 255, 200);
      this.bez([0, 0], [[60, -60, 130, -80, 170, -60], [120, -40, 80, -10, 0, 20]], "rgba(91,108,255,0.8)");
      pop();
    }
    fill(255, 236, 190); ellipse(0, 0, 50, 110); triangle(-14, 50, 14, 50, 0, 150);
    pop();
  },
  codexLabel(t, t0) {   // "Codex 2025" + dates, screen space top-right; outlives the phoenix
    const f = this.f, t1 = this.cue("Think.").s - 0.4;
    if (t > t1 + 0.35) return;
    const lp = C01((t - t0 - 0.15) / 0.3), out = E.inCubic(C01((t - t1) / 0.35));
    if (lp <= 0) return;
    push(); scale(width / W); translate(1560, 104); scale(Math.max(0.001, (0.6 + 0.4 * E.outBack(lp)) * (1 - out)));
    noStroke(); fill(16, 21, 34, 230); rect(-230, -50, 460, 132, 14); fill(INDIGO); rect(-230, -50, 460, 6, 14, 14, 0, 0);
    this.txt("CODEX  ·  2025", 0, 4, { font: f.title, size: 48, color: INDIGO_L, align: CENTER });
    this.txt("same name, completely different animal", 0, 34, { font: f.bodyR, size: 19, color: "rgba(243,239,228,0.85)", align: CENTER });
    this.txt("CLI 16 Apr 2025 · cloud agent 16 May 2025", 0, 64, { font: f.bodyR, size: 17, color: "rgba(243,239,228,0.7)", align: CENTER });
    pop();
  },
  dateTag(t, t0, t1, x, y, title, sub, col) {
    if (t < t0 || t > t1 + 0.35) return;
    const f = this.f, p = E.outBack(C01((t - t0) / 0.35)) * (1 - E.inCubic(C01((t - t1) / 0.35)));
    push(); translate(x, y); scale(Math.max(0.001, p));
    textFont(f.bodyR); textSize(17); const w = Math.max(Ex.tw(sub), 160) + 36;
    noStroke(); fill(16, 21, 34, 225); rect(-w / 2, -52, w, 78, 12); fill(col); rect(-w / 2, -52, w, 6, 12, 12, 0, 0);
    this.txt(title, 0, -16, { font: f.title, size: 32, color: "#FFFFFF", align: CENTER });
    this.txt(sub, 0, 12, { font: f.bodyR, size: 17, color: "rgba(243,239,228,0.85)", align: CENTER });
    pop();
  },

  // ---------- the keyboard handoff ----------
  keyboards(t, c) {
    const tIn = c("Today,").s, tCl = c("Claude").s, tBoom = this.tBoom, tCx = tBoom + 0.2;
    if (t < tIn) return;
    const drop = E.outBack(C01((t - tIn) / 0.9)), hover = Math.sin((t - tIn) * 2.6) * 10;
    const base = { x: 960, y: 700 - 620 * (1 - drop) + hover, h: 170 };
    // "Not yet." (2022) → struck → NOW
    const tNote = c("loop").s, tStrike = c("itself.").s, f = this.f;
    if (t > tNote && t < tCl + 0.3) {
      const a = C01((t - tNote) / 0.3) * (1 - C01((t - tCl) / 0.3));
      push(); noStroke(); fill(16, 21, 34, 205 * a); rect(840, 510, 240, 96, 14); pop();
      this.txt("“Not yet.”", 960, 560, { font: f.hand, size: 46, color: Ex.C.chalk, align: CENTER, alpha: a });
      this.txt("Prof. Regress, 2022", 960, 590, { font: f.bodyR, size: 17, color: "rgba(243,239,228,0.75)", align: CENTER, alpha: a });
      if (t > tStrike) Ex.chalkLine([[870, 548], [1052, 540]], (t - tStrike) / 0.25, { color: Ex.C.pink, weight: 6, seed: 2 });
    }
    // chalk text sits on a light floor: give it a soft dark backing for contrast
    Ex.stamp(t, tStrike + 0.3, "NOW.", 1090, 598, { font: f.title, size: 54, color: Ex.C.amber, rot: -0.12, t1: tCl + 0.1 });
    if (t < tCl) { this.kbSprite(base.x, base.y, base.h, { rot: 0.06 * Math.sin(t * 1.7), t }); return; }
    // split in two on "Claude": copy A flies into Claude's hands, copy B waits for Codex (then dives into the cloud backpack)
    const pa = E.inOutCubic(C01((t - tCl) / 0.45));
    if (pa < 1) {
      const x = base.x + (KB_CL.x - base.x) * pa, y = base.y + (KB_CL.y - base.y) * pa - Math.sin(pa * PI) * 120;
      this.kbSprite(x, y, base.h + (KB_CL.h - base.h) * pa, { rot: -0.1 * pa, alpha: 1 - C01((pa - 0.8) / 0.2), glow: 1 - pa * 0.6, t });
    }
    Ex.burst(t, tCl + 0.43, KB_CL.x, KB_CL.y, { n: 14, color: Ex.C.amber, dur: 0.5, dist: 140, size: 9, seed: 21 });
    const pb = E.inCubic(C01((t - tCx) / 0.45)), split = E.outBack(C01((t - tCl) / 0.35));
    if (pb < 1 && t < tCx + 0.45) {
      const bx = base.x + 40 * split, by = base.y - 30 * split;
      const x = bx + (PACK.x - bx) * pb, y = by + (PACK.y - by) * pb, h = base.h * 0.8 * (1 - 0.9 * pb);
      this.kbSprite(x, y, h, { rot: 0.08 * Math.sin(t * 2), alpha: C01(split * 2), glow: 1 - pb * 0.5, t: t + 1 });
    }
    Ex.burst(t, tCx + 0.45, PACK.x, PACK.y, { n: 16, color: INDIGO_L, dur: 0.55, dist: 150, size: 9, seed: 23 });
  },

  // ---------- split-screen agent windows (from "Repeat" onward) ----------
  win(t, side, o) {
    const f = this.f, L = side === "L";
    const x = (L ? 20 : 980) + (1 - o.slide) * (L ? -1000 : 1000), y = 22, w = 920, vh = (w * 1076) / 1928, vy = y + 40, by = vy + vh, bh = 950 - by;
    push();
    drawingContext.shadowColor = "rgba(0,0,0,0.45)"; drawingContext.shadowBlur = 40; drawingContext.shadowOffsetY = 14;
    noStroke(); fill("#161A24"); rect(x, y, w, 950 - y, 16);
    drawingContext.shadowColor = "transparent";
    fill("#232838"); rect(x, y, w, 40, 16, 16, 0, 0);
    ["#FF5F57", "#FEBC2E", "#28C840"].forEach((cc, i) => { fill(cc); circle(x + 24 + i * 22, y + 20, 12); });
    this.txt(o.title, x + w / 2, y + 27, { font: f.body, size: 17, color: "#C9CFDC", align: CENTER });
    // viewport: lab plate behind the character, pushed in with the clip's own drift
    drawingContext.save(); drawingContext.beginPath(); drawingContext.rect(x, vy, w, vh); drawingContext.clip();
    const z = o.zoom, ax = x + w * 0.5, ay = vy + vh * 0.1;
    push(); translate(ax, ay); scale(z); translate(-ax, -ay);
    const ws = w / o.plateW, wx = o.plateX - o.plateW / 2, wy = o.plateY - (vh / ws) / 2;
    if (this.plate) { imageMode(CORNER); const k = this.plate.width / W; image(this.plate, x, vy, w, vh, wx * k, wy * k, o.plateW * k, (vh / ws) * k); }
    pop();
    if (o.under) o.under(x, vy, w, vh);
    if (o.img) { imageMode(CORNER); image(o.img, x, vy, w, vh); }
    if (o.over) o.over(x, vy, w, vh);
    drawingContext.restore();
    // lower half: tool output
    drawingContext.save(); drawingContext.beginPath(); drawingContext.rect(x, by, w, bh); drawingContext.clip();
    o.bottom(x, by, w, bh);
    drawingContext.restore();
    // status border + dim when the other agent has the floor
    if (o.border) { noFill(); stroke(o.border); strokeWeight(5); rect(x + 2, y + 2, w - 4, 950 - y - 4, 15); }
    if (o.dim > 0) { noStroke(); fill(8, 10, 18, 150 * o.dim); rect(x, y, w, 950 - y, 16); }
    pop();
  },
  claudeTerm(t, x, y, w, h) {
    const f = this.f, c = this.cue, tThree = c("Three").s, tFail = c("failing.").s, tFix = c("Fixing").s, tMig = c("migration.").s;
    noStroke(); fill("#10131B"); rect(x, y, w, h);
    const lx = x + 26; let ly = y + 40;
    const row = (s, col, size = 20, font = f.mono) => { this.txt(s, lx, ly, { font, size, color: col }); ly += size * 1.55; };
    row("claude  ~/notes-app", "rgba(217,119,87,0.9)", 16, f.body);
    if (t > tThree - 0.1) row(Anim.typed("$ pytest", (t - tThree + 0.1) / 0.3), Ex.C.codeFg);
    if (t > tThree + 0.35) {
      const n = Math.min(3, Math.floor((t - tThree - 0.35) / 0.15) + 1);
      const w0 = this.txt("tests/test_users.py ", lx, ly, { font: f.mono, size: 20, color: Ex.C.codeFg });
      this.txt("F".repeat(n), lx + w0, ly, { font: f.mono, size: 20, color: RED }); ly += 31;
    }
    if (t > tFail) {
      const p = E.outBack(C01((t - tFail) / 0.3));
      push(); translate(lx, ly - 22); scale(1, p); noStroke(); fill(255, 92, 106, 60); rect(-8, 0, w - 36, 34, 5); pop();
      this.cross(lx + 12, ly - 5, 18, RED);
      this.txt("3 failed", lx + 34, ly + 2, { font: f.mono, size: 21, color: RED }); ly += 44;
    }
    if (t > tFix - 0.05) {
      row(Anim.typed("● Edit alembic/versions/…_users.py", (t - tFix + 0.05) / 0.4), "#E6B673", 18);
      const p = (t - tFix - 0.35) / 0.5;
      if (p > 0) { noStroke(); fill(255, 92, 106, 40); rect(lx - 8, ly - 21, w - 36, 28, 3); row('-  sa.Column("email", nullable=False)', RED, 17); }
      if (p > 0.5) { noStroke(); fill(74, 222, 128, 40); rect(lx - 8, ly - 21, w - 36, 28, 3); row('+  sa.Column("email", nullable=True)', GREEN, 17); }
    }
    if (t > tMig) row(Anim.typed("$ pytest", (t - tMig) / 0.25), Ex.C.codeFg);
    const tPass = tMig + 0.55;
    if (t > tPass) {
      const p = E.outBack(C01((t - tPass) / 0.3));
      push(); translate(lx, ly - 22); scale(1, p); noStroke(); fill(74, 222, 128, 60); rect(-8, 0, w - 36, 34, 5); pop();
      this.check(lx + 12, ly - 6, 22, GREEN, (t - tPass) / 0.3);
      this.txt("3 passed", lx + 34, ly + 2, { font: f.mono, size: 21, color: GREEN });
    }
    this.tPass = tPass;
  },
  codexPanel(t, x, y, w, h) {
    const f = this.f, c = this.cue, tSnap = c("Patch").s, tOpen = c("Opening").s, tReq = c("request.").s;
    noStroke(); fill("#10131B"); rect(x, y, w, h);
    const lx = x + 26;
    this.txt("codex  cloud sandbox · notes-app", lx, y + 40, { font: f.body, size: 16, color: INDIGO_L });
    if (t < tSnap) {
      this.txt("waiting" + ".".repeat(1 + (Math.floor(t * 3) % 3)), lx, y + 84, { font: f.mono, size: 20, color: "rgba(230,225,207,0.45)" });
      return;
    }
    // parallel sandboxes spin up on the snap, then fold into the pull request
    const up = E.inCubic(C01((t - tOpen) / 0.35));
    const jobs = ["pytest", "npm test", "build"];
    jobs.forEach((j, i) => {
      const t0 = tSnap + 0.08 + i * 0.12, p = E.outBack(C01((t - t0) / 0.3));
      if (p <= 0) return;
      const yy = y + 80 + i * 72 - up * 260, prog = C01((t - t0 - 0.2) / (0.7 + i * 0.15));
      push(); translate(lx + 30, yy); scale(p);
      this.cloud(0, 0, 50, "#F3F4FA");
      fill(INDIGO); noStroke(); rect(-9, 0, 4, 8, 2); rect(3, 0, 4, 8, 2);
      pop();
      this.txt("sandbox " + (i + 1) + "  ▸  " + j, lx + 72, yy + 8, { font: f.mono, size: 19, color: Ex.C.codeFg, alpha: p });
      noStroke(); fill(255, 255, 255, 25); rect(lx + 420, yy - 8, 300, 18, 9);
      fill(INDIGO); rect(lx + 420, yy - 8, 300 * prog, 18, 9);
      if (prog >= 1) this.check(lx + 760, yy, 26, GREEN, (t - t0 - 0.2 - (0.7 + i * 0.15)) / 0.25);
    });
    // the pull request card
    if (t > tOpen) {
      const p = E.outCubic(C01((t - tOpen) / 0.4)), cy = y + 26 + (1 - p) * 300;
      push(); drawingContext.globalAlpha *= p;
      noStroke(); fill("#1E2333"); rect(lx - 6, cy, w - 40, h - 44, 14); fill(INDIGO); rect(lx - 6, cy, 8, h - 44, 14, 0, 0, 14);
      const tw = this.txt("PULL REQUEST", lx + 24, cy + 40, { font: f.tag, size: 20, color: INDIGO_L });
      this.txt("Fix users migration", lx + 24, cy + 92, { font: f.title, size: 46, color: "#FFFFFF" });
      this.txt("codex/fix-migration  →  main", lx + 24, cy + 132, { font: f.mono, size: 19, color: "rgba(230,225,207,0.75)" });
      this.check(lx + 38, cy + 172, 22, GREEN, (t - tOpen - 0.3) / 0.3);
      this.txt("tests passed in the sandbox", lx + 62, cy + 180, { font: f.body, size: 19, color: GREEN, alpha: C01((t - tOpen - 0.3) / 0.3) });
      // button, pressed on "request"
      const bx = lx + w - 330, byy = cy + 150, pressed = t >= tReq, k = pressed ? 1 - 0.08 * Math.sin(C01((t - tReq) / 0.2) * PI) : 1;
      push(); translate(bx + 130, byy + 26); scale(k);
      noStroke(); fill(pressed ? "#2E3A8C" : INDIGO); rect(-130, -26, 260, 52, 10);
      this.txt(pressed ? "PR opened" : "Open pull request", pressed ? 12 : 0, 8, { font: f.body, size: 20, color: "#FFFFFF", align: CENTER });
      if (pressed) this.check(-78, 0, 18, "#FFFFFF", (t - tReq) / 0.25);
      pop();
      pop();
      Ex.burst(t, tReq, bx + 130, byy + 26, { n: 18, color: INDIGO_L, dur: 0.6, dist: 170, size: 9, seed: 31 });
    }
  },
  windows(t) {
    const c = this.cue, tS = this.tSplit, tCx = c("Patch").s, slide = E.outCubic(C01((t - tS) / 0.45));
    const clOn = t < tCx - 0.05, cxOn = t >= tCx - 0.25;
    // left: Claude Code
    const imL = t >= this.fix.audio_at ? this.fix.at(t) : this.clStill;
    const tPass = c("migration.").s + 0.55;
    this.win(t, "L", {
      slide, title: "Claude Code  ·  ~/notes-app", img: imL, zoom: lerpTab(ZOOM_CL, t - this.fix.audio_at),
      plateX: 520, plateY: 560, plateW: 1180, dim: clOn ? 0 : 0.35 * C01((t - tCx + 0.05) / 0.3),
      border: t > c("failing.").s && t < tPass ? `rgba(255,92,106,${0.55 + 0.35 * Math.sin(t * 12)})` : t >= tPass && t < tPass + 1.2 ? GREEN : null,
      bottom: (x, y, w, h) => this.claudeTerm(t, x, y, w, h)
    });
    // right: Codex
    const imR = t >= this.pr.audio_at ? this.pr.at(t) : this.cxStill;
    this.win(t, "R", {
      slide, title: "Codex  ·  cloud sandbox", img: imR, zoom: lerpTab(ZOOM_CX, t - this.pr.audio_at),
      plateX: 1400, plateY: 560, plateW: 1180, dim: cxOn ? 0 : 0.55,
      under: (x, y, w, h) => {   // cloud backpack glow (behind the cut-out)
        if (t < tCx) return;
        const g = C01((t - tCx) / 0.25), px = x + w * 0.61, py = y + h * 0.52;
        const gr = drawingContext.createRadialGradient(px, py, 10, px, py, 220);
        gr.addColorStop(0, `rgba(154,165,255,${0.75 * g})`); gr.addColorStop(1, "rgba(91,108,255,0)");
        drawingContext.fillStyle = gr; noStroke(); circle(px, py, 440 + 30 * Math.sin(t * 8));
      },
      over: (x, y, w, h) => {    // snap spark at the fingertips on "Patch"
        Ex.burst(t, tCx, x + w * 0.3, y + h * 0.33, { n: 12, color: "#FFFFFF", dur: 0.35, dist: 90, size: 8, seed: 41, shape: "line" });
        Ex.burst(t, tCx + 0.03, x + w * 0.3, y + h * 0.33, { n: 10, color: Ex.C.amber, dur: 0.45, dist: 120, size: 7, seed: 42 });
      },
      bottom: (x, y, w, h) => this.codexPanel(t, x, y, w, h)
    });
  },

  // ReAct PhD card (custom so the trajectory formula is set in the math font)
  phd(t, t0, t1) {
    if (t < t0 || t > t1 + 0.4) return;
    const f = this.f, K = width / W, pin = E.outCubic(C01((t - t0) / 0.4)), pout = E.inCubic(C01((t - t1) / 0.35));
    const w = 450, x = 1446 + (1 - pin + pout) * (w + 80), y = 40, h = 300;
    push(); scale(K); translate(x, y);
    drawingContext.shadowColor = "rgba(0,0,0,0.45)"; drawingContext.shadowBlur = 30; drawingContext.shadowOffsetY = 10;
    noStroke(); fill(16, 21, 34, 238); rect(0, 0, w, h, 14); drawingContext.shadowColor = "transparent";
    fill(Ex.C.phd); rect(0, 0, 8, h, 14, 0, 0, 14);
    textFont(f.tag); textSize(20); const tw = Ex.tw("PhD NOTE") + 24; rect(24, 18, tw, 28, 6);
    this.txt("PhD NOTE", 36, 39, { font: f.tag, size: 20, color: "#FFFFFF" });
    this.txt("ReAct: reason and act, interleaved", 24, 84, { font: f.title, size: 29, color: "#FFFFFF" });
    Ex.math("τ = (t_{1}, a_{1}, o_{1}, …, t_{n}, a_{n}, o_{n})", 24, 132, { font: f.mathI, size: 27, color: "#E9E3FF" });
    Ex.math("τ ~ π( · | context)", 24, 170, { font: f.mathI, size: 27, color: "#E9E3FF" });
    this.txt("thought → action → observation, looped until", 24, 208, { font: f.bodyR, size: 18, color: "rgba(236,232,222,0.9)" });
    this.txt("the tests pass: today's agent tool loop.", 24, 232, { font: f.bodyR, size: 18, color: "rgba(236,232,222,0.9)" });
    this.txt("Yao et al. 2022 · arXiv:2210.03629 (ICLR 2023)", 24, 272, { font: f.bodyR, size: 15, color: "rgba(236,232,222,0.55)" });
    pop();
  },

  draw(t) {
    const f = this.f, c = this.cue, K = width / W;
    const tToday = c("Today,").s, tCl = c("Claude").s, tCodex = c("Codex").s, tThink = c("Think.").s, tRep = c("Repeat.").s;
    this.tBoom = c("run").s - 0.05;       // tombstone → phoenix → Codex (on "run the tests")
    this.tSplit = c("Repeat.").e + 0.02;  // split screen hides the wide shot
    background("#F6EEDC");
    // camera (|x-960| <= 960-960/z, |y-540| <= 540-540/z keeps the plate edges out of frame)
    const cam = Ex.cam(t, [
      { t: 0, x: 960, y: 520, z: 1.1 },
      { t: 2.8, x: 960, y: 552, z: 1.04, ease: "inOutCubic" },
      { t: tCodex - 0.1, x: 958, y: 556, z: 1.045, ease: "linear" },
      { t: tCodex + 0.5, x: 1050, y: 585, z: 1.12, ease: "outCubic" },
      { t: this.tBoom + 0.5, x: 1058, y: 590, z: 1.13, ease: "linear" },
      { t: this.tBoom + 1.1, x: 960, y: 440, z: 1.25, ease: "inOutCubic" },
      { t: tThink - 0.35, x: 960, y: 436, z: 1.27, ease: "linear" },
      { t: tThink + 0.25, x: 960, y: 340, z: 1.6, ease: "outCubic" },
      { t: tRep - 0.02, x: 960, y: 340, z: 1.61, ease: "linear" },
      { t: tRep + 0.2, x: 960, y: 342, z: 1.68, ease: "outExpo" },
      { t: this.tSplit + 0.1, x: 960, y: 540, z: 1.03, ease: "inOutCubic" }
    ]);
    Ex.withCam({ ...cam, z: cam.z * K }, () => {
      if (this.plate) { imageMode(CORNER); image(this.plate, 0, 0, W, H); }
      this.wall(t, c);
      this.tombstone(t, tCodex, this.tBoom);
      // robots (stills) on the floor
      if (t >= tCl) Ex.puppet(this.clStill, t, { x: CL.x, y: CL.y, h: CL.h, t0: tCl + 0.3, from: "fade", enterDur: 0.2, bob: 4, breathe: 0.012, speed: 0.9 });
      if (t >= this.tBoom + 0.2) {
        const gl = C01((t - this.tBoom - 0.2) / 0.3);
        const g = drawingContext.createRadialGradient(PACK.x, PACK.y, 5, PACK.x, PACK.y, 130);
        g.addColorStop(0, `rgba(154,165,255,${0.6 * gl})`); g.addColorStop(1, "rgba(91,108,255,0)");
        drawingContext.fillStyle = g; noStroke(); circle(PACK.x, PACK.y, 260);
        Ex.puppet(this.cxStill, t, { x: CX.x, y: CX.y, h: CX.h, t0: this.tBoom + 0.2, from: "pop", bob: 5, breathe: 0.012, speed: 1.1, phase: 0.3 });
      }
      this.phoenix(t, this.tBoom);
      this.keyboards(t, c);
      this.dateTag(t, tCl + 0.25, c("run").s, CL.x - 10, 420, "CLAUDE CODE", "research preview 24 Feb 2025 · GA 22 May 2025", Ex.C.claude);
    });
    // date chip, top-left
    if (t > tToday && t < tCl + 0.4) {
      const p = E.outCubic(C01((t - tToday) / 0.35)) * (1 - C01((t - tCl) / 0.4));
      push(); scale(K); drawingContext.globalAlpha *= p; noStroke(); fill(16, 21, 34, 220); rect(36, 34, 250, 56, 10); fill(Ex.C.amber); rect(36, 34, 8, 56, 10, 0, 0, 10);
      this.txt("TODAY  ·  2025", 60, 73, { font: f.title, size: 36, color: "#FFFFFF" }); pop();
    }
    if (t >= this.tBoom) this.codexLabel(t, this.tBoom);
    this.phd(t, tThink + 0.15, tRep + 0.55);
    // split screen: dim the lab, slide in the two agent sessions
    if (t >= this.tSplit) {
      const d = C01((t - this.tSplit) / 0.3);
      noStroke(); fill(12, 14, 22, 175 * d); rect(0, 0, width, height);
      push(); scale(K); this.windows(t); pop();
      const fl = C01(1 - Math.abs(t - this.tSplit - 0.05) / 0.18);
      if (fl > 0) { fill(255, 255, 255, 120 * fl); rect(0, 0, width, height); }
    }
    Ex.caption(t, this.ph, { font: f.body, size: 34 * K, y: height - 34 * K, speakers: { prof: "#FFFFFF", claude: "#F0A283", codex: INDIGO_L } });
    // entry: clean white flash-in that opens as two light doors
    if (t < 1.0) {
      const p = E.inOutCubic(C01((t - 0.12) / 0.8));
      push(); scale(K); noStroke();
      fill("#FBF8F1"); rect(-p * 980, 0, 960, H); rect(960 + p * 980, 0, 960, H);
      fill(255, 214, 140, 160 * (1 - p)); rect(955 - p * 980, 0, 5, H); rect(960 + p * 980, 0, 5, H);
      pop();
      fill(255, 255, 255, 255 * (1 - C01(t / 0.3))); rect(0, 0, width, height);
    }
  }
});
