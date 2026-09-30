// s06 copy-paste loop, THE PEAK (song 111.292–137.125 s, frames 2671–3291; t is section-local). Plate = s05/desk2022.
// p11 0.17–6.17 "Copy. Paste. Run. Traceback. Copy the traceback. Paste it back." → a circular montage: the world is seen through
//   a porthole ringed by a COPY · PASTE · RUN · TRACEBACK wheel that snaps to each word and spins faster every loop; hard cuts
//   between four stations (chat, dev, terminal, red traceback); Ctrl+C / Ctrl+V keycap counter (props-d keycaps split at x 340).
// ch02 6.23–9.91 Chatty pops out of the chat and bows (H3 chat_sorry, lip-sync); Davinci's endless paper curl streams across the
//   chat (callback to s03; props-b paper + beret).
// p12 10.14–25.34: schema mismatch (Py throws / Reacty catches clipboard sheets, Postgres elephant sweats, field names differ),
//   "the chat forgets your models" (old messages fade), version chaos, Q&A tumbleweed + PhD card (PNAS Nexus 2024), the ≈4k
//   token bar overflows INTO the dev's head, then on "real" everything stops: calm hold, prof deadpan, "context window: you".
//
// Plate landmarks (w6-s05 log, 1920×1080 world): main screen x763–1440 y319–658; second screen x1469–1786 y373–678;
// desk top edge y≈765, desk front edge y≈900; left third x0–700 empty wall; mug x1627–1776 y707–837; lamp top-right.
const W = 1920, H = 1080;
const MAIN = { x: 769, y: 325, w: 665, h: 327 }, SIDE = { x: 1475, y: 381, w: 305, h: 291 };
// character bounds inside their source frames (fractions, measured with media:sprite_box on the keyframes)
const BB = {
  dev: [0.3735, 0.1686, 0.2507, 0.6908], chat: [0.339, 0.0827, 0.3314, 0.7845], py: [0.2798, 0.1055, 0.58, 0.81],
  atom: [0.2057, 0.0905, 0.6403, 0.7617], prof: [0.335, 0.067, 0.2929, 0.9173]
};
const DEV = { x: 330, y: 1070, h: 700, head: [350, 540] };   // mirrored so he faces the monitors
const CHAT = { x: 1318, y: 760, h: 430 }, PY = { x: 760, y: 905, h: 330 }, ATOM = { x: 1640, y: 762, h: 330 };
const PROF = { x: 1560, y: 1092, h: 830 };
const PY_TIP = [925, 640], ATOM_GLOVE = [1452, 566];
const EL = { x: 1196, y: 872, h: 178 };
const S05_END = { x: 990, y: 530, z: 1.2, r: 0 };                  // s05 final camera key (prompts/s05/05_overlay.js)
// H3 drift (measured on raw clip frames): dev_frantic pushes in linearly, z = 1 + 0.0204·t about clip px (990, 461) of 1928×1076
// (feet 931→1027, height 754→908 over 10 s); chat_sorry ≈ 1 + 0.025·t with the head top nearly fixed (clip px 960, 90).
const DEV_Z = (ct) => 1 + 0.0204 * ct, DEV_ZP = [0.5135, 0.4284];
const CHAT_Z = (ct) => 1 + 0.025 * Math.max(0, ct), CHAT_ZP = [0.498, 0.084];
// chat_sorry lip-sync: media:mouth best_lag −6 f (r 0.42–0.47 on three boxes) and frames confirm the visor mouth leads the audio
// (open "o" at 3.4 s before "code" 3.45, closed by 3.7), so the clip is shown 6 frames late.
const CHAT_DELAY = 6;
const R_PORT = 430;                                          // porthole radius (screen units)
const BAR = { x0: 520, x1: 1480, y: 196, h: 58, slot: 158 }; // token bar (world), fills right → left

const lerpTab = (tab, x) => {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) if (x < tab[i][0]) {
    const [a, va] = tab[i - 1], [b, vb] = tab[i];
    return va + ((vb - va) * (x - a)) / (b - a);
  }
  return tab[tab.length - 1][1];
};
const C01 = (v) => Anim.clamp01(v), E = Anim.ease;
// Monospace code renderer copied from prompts/s05/05_overlay.js: Ex.code advances by textWidth(token), which p5 + opentype
// return as ≈0 for punctuation, so "." and "(" overlapped; here every character advances one fixed cell.
const KW = new Set("def return import from function const return useState useEffect SELECT FROM True None".split(" "));
const codeMono = (lines, x, y, { lang = "py", font, size = 16, progress: pr = 1, cursor = false, gutter = true, lineH = 1.45 } = {}) => {
  push(); textFont(font); textSize(size); textAlign(LEFT, TOP); noStroke();
  const cw = textWidth("M"), lh = size * lineH, gx = gutter ? cw * 3 : 0;
  const total = lines.reduce((n, l) => n + l.length + 1, 0);
  let budget = Math.round(total * Anim.clamp01(pr)), lastX = x + gx, lastY = y;
  lines.forEach((line, i) => {
    if (budget <= 0 && i > 0) return;
    const ly = y + i * lh, shown = line.slice(0, Math.max(0, budget)); budget -= line.length + 1;
    if (gutter) { fill(Ex.C.codeCom); text(String(i + 1), x, ly); }
    const toks = shown.match(/#[^\n]*|"[^"]*"?|\b\d+\b|@\w+|\b\w+\b|./g) || [];
    let cx = x + gx;
    for (const tok of toks) {
      fill(lang === "py" && /^#/.test(tok) ? Ex.C.codeCom : /^"/.test(tok) ? Ex.C.codeStr : /^\d/.test(tok) ? Ex.C.codeNum : /^@/.test(tok) ? Ex.C.codeConst
        : KW.has(tok) ? Ex.C.codeKw : /^[A-Z]\w/.test(tok) ? Ex.C.codeFn : Ex.C.codeFg);
      for (const ch of tok) { if (ch !== " ") text(ch, cx, ly); cx += cw; }
    }
    lastX = cx; lastY = ly;
  });
  if (cursor && Math.floor((ANIM.t || 0) * 2.5) % 2 === 0) { fill(Ex.C.amber); rect(lastX + 2, lastY, cw * 0.6, size * 1.05); }
  pop();
};

Anim.sketch({
  async load() {
    this.f = await Anim.fonts({ mono: "mono.ttf", tag: "din-alt.ttf", title: "din-cond.ttf", body: "body-med.ttf", bodyR: "body.ttf",
      black: "body-black.ttf", hand: "hand.ttf" });
    const img = (p) => new Promise((ok) => loadImage(p, ok, () => ok(null)));
    this.plate = await img("/output/s05/02_kf_desk2022.png");
    const d = "/output/props-d-v1/sprites/";
    [this.sheet, this.qa, this.weed, this.eleph, this.caps, this.warn, this.clipb] = await Promise.all(
      ["sheet", "qa", "tumbleweed", "elephant", "keycaps", "warning", "clipboard"].map((n) => img(d + n + ".png")));
    this.paper = await img("/output/props-b-v1/sprites/paper.png");
    this.beret = await img("/output/props-b-v1/sprites/beret.png");
    if (this.caps) { this.capL = this.caps.get(0, 0, 340, this.caps.height); this.capR = this.caps.get(340, 0, this.caps.width - 340, this.caps.height); }
    this.dev = await Anim.clip("dev_frantic");
    this.sorry = await Anim.clip("chat_sorry");
    this.py = (await Anim.clip("py_throw")).frame(0);
    this.atom = (await Anim.clip("atom_catch")).frame(0);
    this.prof = (await Anim.clip("prof_deadpan")).frame(0);
    // section words carry no speaker/line: ch02 (Chatty) is 6.2–9.95 s local
    this.words = Anim.data("words").map((w) => {
      const chat = w.s >= 6.1 && w.s < 10.0;
      return { ...w, speaker: chat ? "chat" : "prof", line: chat ? "ch02" : w.s < 6.1 ? "p11" : "p12" };
    });
    const c = this.cue = Anim.cues(this.words);
    this.ph = Ex.phrases(this.words).map((p, i, a) => (a[i + 1] ? { ...p, e: Math.min(p.e, a[i + 1].s - 0.4) } : p));
    const T = this.T = {
      copy1: c("copy", 1).s, paste1: c("paste", 1).s, run: c("run").s, tb1: c("traceback", 1).s, copy2: c("copy", 2).s,
      tb2: c("traceback", 2).s, paste2: c("paste", 2).s, back: c("back").s, backE: c("back").e,
      I: c("i").s, apol: c("apologize").s, conf: c("confusion").s, heres: c("here's").s, code: c("code").s, codeE: c("code").e,
      now: c("now").s, react: c("react").s, doesnt: c("doesn't").s, match: c("match").s, schema: c("schema").s, so: c("so").s,
      paste3: c("paste", 3).s, too: c("too").s, chat: c("chat").s, forgets: c("forgets").s, models: c("models").s,
      forget: c("forget").s, version: c("version").s, pasted: c("pasted").s, ctx: c("context", 1).s, win: c("window", 1).s,
      four: c("four").s, thousand: c("thousand").s, tokens: c("tokens").s, and: c("and").s, real: c("real").s, you: c("you", 4).s,
      youE: c("you", 4).e
    };
    this.T.calm = T.real - 0.02;
    // montage stations: [cue, wheel index, camera]
    this.stations = [
      { t: -1, k: 0, cam: { x: 1030, y: 470, z: 1.9 } },
      { t: T.copy1, k: 0, cam: { x: 1010, y: 470, z: 1.95 }, word: "COPY." },
      { t: T.paste1, k: 1, cam: { x: 330, y: 590, z: 1.75 }, word: "PASTE." },
      { t: T.run, k: 2, cam: { x: 1622, y: 528, z: 2.05 }, word: "RUN." },
      { t: T.tb1, k: 3, cam: { x: 1612, y: 520, z: 2.45 }, word: "TRACEBACK." },
      { t: T.copy2, k: 4, cam: { x: 1600, y: 522, z: 2.0 }, word: "COPY", sub: "the traceback" },
      { t: T.paste2, k: 5, cam: { x: 1080, y: 500, z: 1.85 }, word: "PASTE", sub: "it back" }
    ];
    // Ctrl+C / Ctrl+V presses: the spoken ones, then an accelerating frantic stream through p12 until the calm
    const cp = [T.copy1, T.copy2], vp = [T.paste1, T.paste2];
    let tt = T.now, gap = 0.62, i = 0;
    while (tt < T.calm - 0.1) { (i % 2 ? vp : cp).push(tt); tt += gap; gap = Math.max(0.16, gap * 0.955); i++; }
    this.pressC = cp.sort((a, b) => a - b); this.pressV = vp.sort((a, b) => a - b);
    // clipboard ping-pong (Py → Reacty on even throws, back on odd ones)
    const TH = [T.react, T.doesnt, T.match, T.schema, T.so, T.paste3, T.paste3 + 0.33, T.too, T.too + 0.28];
    const LB = ["schemas.py", "Form.jsx", "schemas.py v2", "Form.jsx v2", "models.py", "Form_final.jsx", "schemas_v3.py", "Form_final2.jsx", "traceback.txt"];
    this.throws = TH.map((t0, j) => ({ t0, dir: j % 2 ? -1 : 1, label: LB[j], dur: Math.max(0.3, 0.55 - j * 0.03) }));
    // token chunks: arrive on the words, then overflow every 0.19 s
    const arr = [T.ctx - 0.2, T.ctx, T.win, T.four - 0.25, T.four, T.thousand];
    for (let a = T.thousand + 0.24; a < T.real - 0.1; a += 0.19) arr.push(a);
    const CL = ["models.py", "schemas.py", "Form.jsx", "traceback", "apology", "Form_v2", "traceback", "schemas_v3", "apology", "Form_final",
      "models.py?", "traceback", "apology", "Form_final2", "which one?", "traceback", "apology", "schemas_v4"];
    this.chunks = arr.map((a, j) => ({ a, label: CL[j % CL.length], col: [Ex.C.pyYellow, Ex.C.react, "#FF8F70", Ex.C.pink, "#B9A8FF"][j % 5] }));
  },

  // ---------------- helpers ----------------
  // draw a cut-out frame with its character box bottom-centre at (x, y), character height h (world units)
  put(im, bb, x, y, h, { flip = false, rot = 0, sx = 1, sy = 1, alpha = 1, zc = 1, zp = null } = {}) {
    if (!im) return;
    const k = h / (bb[3] * im.height);
    push(); translate(x, y); if (rot) rotate(rot); scale(flip ? -sx : sx, sy);   // mirroring about the anchor keeps it in place
    drawingContext.globalAlpha *= alpha;
    imageMode(CORNER);
    const ox = -(bb[0] + bb[2] / 2) * im.width * k, oy = -(bb[1] + bb[3]) * im.height * k;
    if (zc !== 1 && zp) {   // H3 push-in compensation: draw the frame at 1/z about the measured drift pivot
      const px = ox + zp[0] * im.width * k, py = oy + zp[1] * im.height * k;
      translate(px, py); scale(1 / zc); translate(-px, -py);
    }
    image(im, ox, oy, im.width * k, im.height * k);
    pop();
  },
  // keep the plate edges out of frame for any roll (full-frame) or inside a circle of screen radius R (porthole)
  clampCam(cam, R = 0) {
    let { x, y, z, r = 0 } = cam;
    let hw, hh;
    if (R) { z = Math.max(z, R / 520); hw = hh = R / z; }
    else {
      const cs = Math.abs(Math.cos(r)), sn = Math.abs(Math.sin(r));
      hw = (960 * cs + 540 * sn) / z; hh = (960 * sn + 540 * cs) / z;
      const g = Math.max(hw / 960, hh / 540, 1); z *= g; hw /= g; hh /= g;
    }
    return { x: Math.min(W - hw, Math.max(hw, x)), y: Math.min(H - hh, Math.max(hh, y)), z, r };
  },
  withCam(cam, fn, shake = [0, 0]) {
    push(); translate(960 + shake[0], 540 + shake[1]); if (cam.r) rotate(cam.r); scale(cam.z); translate(-cam.x, -cam.y); fn(); pop();
  },
  devFrame(t) {
    const n = this.dev.frames, tf = Math.min(t, this.T.calm) * 24 * 1.08;   // a hair faster than real time: more frantic
    const m = Math.floor(tf) % (2 * n - 2);
    const i = m < n ? m : 2 * n - 2 - m;
    return { im: this.dev.frame(i), z: DEV_Z(i / 24) };
  },
  pressAmt(list, t) {   // 0..1 key-down envelope and the press count so far
    let n = 0, d = 0;
    for (const p of list) if (t >= p) { n++; d = Math.max(d, 1 - (t - p) / 0.14); }
    return { n, d: C01(d) };
  },

  // ---------------- screens ----------------
  chatUI(t, msgs, { scrollExtra = 0, dim = 0 } = {}) {
    const f = this.f, S = MAIN;
    push();
    drawingContext.save(); drawingContext.beginPath(); drawingContext.rect(S.x, S.y, S.w, S.h); drawingContext.clip();
    noStroke(); fill("#F7F7F8"); rect(S.x, S.y, S.w, S.h);
    // message layout
    const pad = 16, top = S.y + 40, maxW = S.w - 120;
    textFont(f.bodyR); textSize(15);
    const items = [];
    let H0 = 0;
    for (const m of msgs) {
      if (t < m.t0) continue;
      const g = E.outBack(C01((t - m.t0) / 0.22));
      let lines, lh, font, fs;
      if (m.kind === "text") {
        let s = m.text;
        if (m.type) s = Anim.typed(m.text, C01((t - m.type[0]) / (m.type[1] - m.type[0])));
        textFont(f.bodyR); textSize(15); lines = Ex.wrap(s || " ", maxW - 30); lh = 21; font = f.bodyR; fs = 15;
      } else { lines = m.lines; lh = 19; font = f.mono; fs = 13; }
      const bh = lines.length * lh + 18 + (m.file ? 20 : 0);
      items.push({ m, lines, lh, font, fs, bh, g });
      H0 += (bh + 12) * Math.min(1, g);
    }
    const avail = S.h - 52;
    let y = top - Math.max(0, H0 - avail) - scrollExtra;
    for (const it of items) {
      const { m, lines, lh, font, fs, bh, g } = it;
      textFont(font); textSize(fs);
      const w = Math.min(maxW, Math.max(...lines.map((l) => Ex.tw(l))) + 30, maxW);
      const bw = Math.max(w, m.file ? 150 : 0);
      const x = m.role === "user" ? S.x + S.w - pad - bw : S.x + pad + 34;
      const a = (m.alpha ? m.alpha(t) : 1) * C01(g * 1.4);
      push(); drawingContext.globalAlpha *= a;
      translate(x + bw / 2, y + bh / 2); scale(0.6 + 0.4 * Math.min(1.1, g)); translate(-(x + bw / 2), -(y + bh / 2));
      if (m.role === "bot") { fill(Ex.C.chat); circle(S.x + pad + 13, y + 14, 22); fill("#FFFFFF"); circle(S.x + pad + 13, y + 14, 8); }
      const bg = m.kind === "err" ? "#FFE9EC" : m.kind === "code" ? "#1B1F2B" : m.role === "user" ? "#E3E4EA" : "#FFFFFF";
      fill(bg); stroke(m.kind === "err" ? "#F2A1AE" : "#E0E0E6"); strokeWeight(1); rect(x, y, bw, bh, 12); noStroke();
      let ty = y + 9;
      if (m.file) { textFont(f.tag); textSize(14); fill(m.kind === "code" ? "#9AA4B8" : "#8A8A96"); Ex.text(m.file, x + 14, ty + 1); ty += 20; }
      textFont(font); textSize(fs); textAlign(LEFT, TOP);
      if (m.sel) {   // selection highlight sweeping over the code (Ctrl+C)
        const p = C01((t - m.sel[0]) / 0.35), q = m.sel[1] ? 1 - C01((t - m.sel[1]) / 0.2) : 1;
        if (p > 0 && q > 0) { fill(66, 133, 244, 110 * q); rect(x + 8, ty - 2, (bw - 16) * p, lines.length * lh + 4, 4); }
      }
      lines.forEach((l, i) => {
        if (m.kind === "code") codeMono([l], x + 12, ty + i * lh, { font, size: fs, gutter: false, cursor: false, lineH: 1.4 });
        else { fill(m.kind === "err" ? "#D0243D" : "#2B2B33"); Ex.text(l, x + 14, ty + i * lh); }
      });
      if (m.tag && m.tagAt !== undefined && t > m.tagAt) {
        const p = C01((t - m.tagAt) / 0.25);
        drawingContext.globalAlpha = 1; fill(90, 90, 100, 230 * p); textFont(f.tag); textSize(13);
        const s = m.tag, tw = Ex.tw(s) + 16; rect(x + bw - tw - 6, y - 9, tw, 20, 6); fill(255, 255, 255, 255 * p); Ex.text(s, x + bw - tw + 2, y - 6);
      }
      pop();
      y += (bh + 12) * Math.min(1, g);
    }
    // header bar
    fill("#ECECF1"); rect(S.x, S.y, S.w, 30); fill(Ex.C.chat); circle(S.x + 18, S.y + 15, 12);
    fill("#5D5D6B"); textFont(f.tag); textSize(15); textAlign(LEFT, CENTER); Ex.text("chat  ·  new conversation", S.x + 32, S.y + 15);
    if (dim > 0) { fill(10, 12, 24, 160 * dim); rect(S.x, S.y, S.w, S.h); }
    drawingContext.restore();
    pop();
  },

  schemaPanel(t) {
    const f = this.f, S = MAIN, T = this.T;
    const a = C01((t - T.now) / 0.2);
    push();
    drawingContext.save(); drawingContext.beginPath(); drawingContext.rect(S.x, S.y, S.w, S.h); drawingContext.clip();
    drawingContext.globalAlpha *= a;
    noStroke(); fill("#1B1F2B"); rect(S.x, S.y, S.w, S.h); fill("#252A38"); rect(S.x, S.y, S.w, 30);
    fill("#9AA4B8"); textFont(f.tag); textSize(15); textAlign(LEFT, CENTER); Ex.text("same field, three names", S.x + 14, S.y + 15);
    const cols = [["Form.jsx", "React form", Ex.C.react, ["firstName", "emailAddress", "createdAt"]],
      ["schemas.py", "Pydantic", Ex.C.pyYellow, ["first_name", "email", "created_at"]],
      ["users", "Postgres", "#8DB3E2", ["fname", "email_address", "created"]]];
    const cw = S.w / 3;
    cols.forEach(([file, kind, col, rows], i) => {
      const x = S.x + i * cw + 20, y0 = S.y + 50;
      fill(col); textFont(f.title); textSize(26); textAlign(LEFT, TOP); Ex.text(file, x, y0);
      fill("#9AA4B8"); textFont(f.tag); textSize(14); Ex.text(kind, x, y0 + 30);
      rows.forEach((r, j) => {
        const ry = y0 + 70 + j * 58, p = C01((t - T.react - 0.1 - j * 0.12 - i * 0.05) / 0.2);
        drawingContext.globalAlpha = a * p;
        fill("#262C3B"); rect(x - 8, ry - 6, cw - 34, 40, 6);
        fill(Ex.C.codeFg); textFont(f.mono); textSize(18); Ex.text(r, x + 2, ry + 4);
        drawingContext.globalAlpha = a;
        if (i < 2 && t > T.doesnt + j * 0.12) {   // red ≠ between the columns, flashing
          const q = C01((t - T.doesnt - j * 0.12) / 0.12), fl = 0.75 + 0.25 * Math.sin(t * 18 + j);
          fill(255, 92, 108, 255 * q * fl); textFont(f.black); textSize(30); textAlign(CENTER, TOP);
          text("≠", S.x + (i + 1) * cw - 8, ry + 1); textAlign(LEFT, TOP);
        }
      });
    });
    drawingContext.restore();
    pop();
  },

  sideScreen(t) {
    const f = this.f, S = SIDE, T = this.T;
    push();
    drawingContext.save(); drawingContext.beginPath(); drawingContext.rect(S.x, S.y, S.w, S.h); drawingContext.clip();
    noStroke();
    const qa = t >= T.chat - 0.3 && t < T.ctx - 0.3;
    if (qa) {   // a generic Q&A page (no logo) with a tumbleweed rolling through
      fill("#F4F2EE"); rect(S.x, S.y, S.w, S.h); fill("#E3DFD6"); rect(S.x, S.y, S.w, 26);
      fill("#6B6B78"); textFont(f.tag); textSize(13); textAlign(LEFT, CENTER); Ex.text("Q&A  ·  newest questions", S.x + 10, S.y + 13);
      if (this.qa) for (let i = 0; i < 2; i++) { push(); drawingContext.globalAlpha *= 0.55; Ex.img(this.qa, S.x + S.w / 2, S.y + 95 + i * 120, 100); pop(); }
      const p = C01((t - T.chat) / (T.pasted - T.chat + 0.3));
      const wx = S.x + S.w + 70 - (S.w + 160) * p, wy = S.y + S.h - 52 - Math.abs(Math.sin(p * 9)) * 28, rot = -p * 14;
      fill(58, 40, 22, 200); ellipse(wx, S.y + S.h - 16, 70, 10);
      fill(64, 44, 26); circle(wx, wy, 58);
      Ex.img(this.weed, wx, wy, 82, { rot });
      for (let i = 0; i < 5; i++) { const dx = wx + 40 + i * 16, dp = C01(1 - i * 0.18); fill(200, 180, 150, 120 * dp); circle(dx, S.y + S.h - 20 - i * 3, 8 - i); }
    } else {
      fill(Ex.C.codeBg); rect(S.x, S.y, S.w, S.h);
      textFont(f.mono); textSize(12.5); textAlign(LEFT, TOP);
      const x = S.x + 10; let y = S.y + 12;
      const L = (s, col) => { fill(col); Ex.text(s, x, y); y += 17; };
      const typed = Anim.typed("uvicorn main:app --reload", C01((t - T.run) / 0.45));
      L("$ " + (t >= T.run ? typed : ""), Ex.C.codeFg);
      if (t > T.run + 0.4) { L("INFO: Started server process", "#8FA3B8"); L("INFO: Application startup complete.", "#8FA3B8"); }
      if (t > T.tb1 - 0.25) L("POST /users  500 Internal Server Error", Ex.C.pink);
      if (t >= T.tb1) {
        const flash = t < T.tb1 + 0.35 ? 0.5 + 0.5 * Math.sin(t * 60) : 0;
        if (flash) { fill(255, 60, 80, 70 * flash); rect(S.x, S.y, S.w, S.h); }
        y += 4;
        const sel = C01((t - T.copy2) / 0.4), selOut = t > T.paste2 ? 1 : 0;
        if (sel > 0 && !selOut) { fill(66, 133, 244, 120); rect(x - 4, y - 2, (S.w - 14) * sel, 17 * 3 + 4, 3); }
        L("Traceback (most recent call last):", "#FF5C6C");
        L('  File "main.py", in create_user', "#FF8A96");
        L("KeyError: 'email'", "#FF5C6C");
        if (this.warn) Ex.img(this.warn, S.x + S.w - 58, S.y + S.h - 60, 84, { rot: 0.06 * Math.sin(t * 20) * (t < T.tb1 + 0.6 ? 1 : 0) });
      }
    }
    drawingContext.restore();
    pop();
  },

  // Davinci's endless tractor-feed paper streams across the chat (callback to s03's "cannot stop continuing")
  paperStream(t) {
    const T = this.T, t0 = T.heres - 0.1, t1 = T.now + 0.35;
    if (t < t0 || t > t1) return;
    const out = C01((t - T.now) / 0.35), L = 2300 * E.outCubic(C01((t - t0) / 1.6));
    const P = (s) => {   // path length s → point: across the chat, then over the desk edge
      if (s < 760) return [MAIN.x - 10 + s, 400 + 34 * Math.sin(s / 70) + s * 0.05];
      const u = s - 760; return [MAIN.x + 750 + u * 0.55, 440 + u * 0.8 + 20 * Math.sin(u / 60)];
    };
    push(); drawingContext.globalAlpha *= 1 - out; translate(0, out * 200);
    const step = 12, n = Math.floor(L / step);
    noStroke();
    for (let i = 0; i < n; i++) {
      const [ax, ay] = P(i * step), [bx, by] = P(i * step + step);
      const ang = Math.atan2(by - ay, bx - ax), nx = -Math.sin(ang) * 34, ny = Math.cos(ang) * 34;
      fill(i % 2 ? "#F4EAD2" : "#F6EEDC"); quad(ax + nx, ay + ny, bx + nx, by + ny, bx - nx, by - ny, ax - nx, ay - ny);
      if ((i + Math.floor(t * 20)) % 2 === 0) { fill(Ex.C.ink); circle(ax + nx * 0.8, ay + ny * 0.8, 3.2); circle(ax - nx * 0.8, ay - ny * 0.8, 3.2); }
    }
    stroke(Ex.C.ink); strokeWeight(2); noFill();
    for (const sgn of [1, -1]) { beginShape(); for (let i = 0; i <= n; i++) { const [ax, ay] = P(i * step), [bx, by] = P(i * step + 1); const ang = Math.atan2(by - ay, bx - ax); vertex(ax - Math.sin(ang) * 34 * sgn, ay + Math.cos(ang) * 34 * sgn); } endShape(); }
    noStroke();
    // faint "code" rows printed on the strip
    fill(90, 80, 70, 120);
    for (let i = 3; i < n; i += 3) { const [ax, ay] = P(i * step); rect(ax - 2, ay - 16, 5, 26, 2); }
    pop();
    // the beret peeks over the monitor's top-left corner: Davinci is hiding back there, still printing
    if (this.beret) {
      const p = E.outBack(C01((t - t0 + 0.2) / 0.4)) * (1 - out);
      push(); drawingContext.save(); drawingContext.beginPath(); drawingContext.rect(700, 150, 400, 172); drawingContext.clip();
      Ex.img(this.beret, 830, 322 - 42 * p + 3 * Math.sin(t * 9), 92, { rot: -0.18 });
      drawingContext.restore(); pop();
      if (p > 0.5) {
        push(); drawingContext.globalAlpha *= C01((p - 0.5) * 2); textFont(this.f.hand); textSize(26); fill(Ex.C.amber); textAlign(LEFT, BASELINE);
        Ex.text("Davinci: still printing…", 690, 256); pop();
      }
    }
  },

  // Py → Reacty clipboard ping-pong
  sheets(t) {
    const f = this.f;
    for (const th of this.throws) {
      const p = (t - th.t0) / th.dur;
      if (p < 0 || p > 1) continue;
      const [a, b] = th.dir > 0 ? [PY_TIP, ATOM_GLOVE] : [ATOM_GLOVE, PY_TIP];
      const e = E.inOutCubic(p), x = a[0] + (b[0] - a[0]) * e, y = a[1] + (b[1] - a[1]) * e - Math.sin(p * PI) * 330;
      for (let k = 1; k <= 3; k++) {   // motion trail
        const pk = Math.max(0, p - k * 0.05), ek = E.inOutCubic(pk);
        fill(246, 238, 220, 60 - k * 15); noStroke();
        circle(a[0] + (b[0] - a[0]) * ek, a[1] + (b[1] - a[1]) * ek - Math.sin(pk * PI) * 330, 60 - k * 10);
      }
      push(); translate(x, y); rotate(th.dir * p * TWO_PI * 1.25);
      Ex.img(this.sheet, 0, 0, 118);
      fill(Ex.C.ink); textFont(f.mono); textSize(13); textAlign(CENTER, CENTER); text(th.label, 0, -8);
      fill(120, 120, 130); for (let i = 0; i < 3; i++) rect(-28, 8 + i * 9, 56 - i * 10, 3);
      pop();
    }
  },

  elephant(t) {
    const T = this.T, t0 = T.now + 0.25, t1 = T.chat - 0.2;
    if (t < t0 || t > t1 + 0.3 || !this.eleph) return;
    const sh = (t > T.doesnt ? 3 + 3 * C01((t - T.schema) / 1) : 1) * Math.sin(t * 40);
    Ex.puppet(this.eleph, t, { x: EL.x + sh, y: EL.y, h: EL.h, t0, t1, from: "pop", bob: 3, speed: 2.2, breathe: 0.03 });
    // flying sweat drops, more of them once the schemas disagree
    const rate = t > T.doesnt ? 7 : 2.5;
    for (let i = 0; i < 14; i++) {
      const ph = ((t - t0) * rate / 6 + i / 14) % 1;
      if (ph < 0 || t - t0 < 0.3 || (i % 2 && t < T.doesnt)) continue;
      const side = i % 2 ? 1 : -1, x = EL.x + side * (30 + ph * 90), y = EL.y - EL.h * 0.95 - Math.sin(ph * PI) * 70 + ph * 120;
      noStroke(); fill(97, 218, 251, 220 * (1 - ph)); push(); translate(x, y); rotate(side * 0.4); ellipse(0, 0, 11, 16); triangle(-5, -4, 5, -4, 0, -14); pop();
    }
    if (t > t0 + 0.2) this.pill(EL.x, EL.y + 18, "Postgres", Ex.C.pg, t, t0 + 0.2);
  },
  pill(x, y, s, col, t, t0) {
    const p = E.outBack(C01((t - t0) / 0.3));
    if (p <= 0) return;
    push(); translate(x, y); scale(p); textFont(this.f.tag); textSize(20); const w = Ex.tw(s) + 22;
    noStroke(); fill(col); rect(-w / 2, -14, w, 28, 14); fill("#FFFFFF"); textAlign(LEFT, CENTER); Ex.text(s, -w / 2 + 11, 1); pop();
  },

  tokenBar(t) {
    const T = this.T, f = this.f;
    if (t < T.ctx - 0.5 || t >= T.calm) return;
    const a = C01((t - T.ctx + 0.5) / 0.3);
    push(); drawingContext.globalAlpha *= a;
    // frame + labels
    fill(16, 21, 34, 225); noStroke(); rect(BAR.x0 - 14, BAR.y - 58, BAR.x1 - BAR.x0 + 28, BAR.h + 74, 12);
    textFont(f.title); textSize(34); fill(Ex.C.amber); textAlign(LEFT, BASELINE); Ex.text("CONTEXT WINDOW  ≈ 4k tokens", BAR.x0, BAR.y - 12);
    textFont(f.bodyR); textSize(16); fill(243, 239, 228, 170); textAlign(RIGHT, BASELINE);
    text("GPT-3.5 era · text-davinci-003 ≈ 4,097", BAR.x1, BAR.y - 14);
    fill("#2A3142"); rect(BAR.x0, BAR.y, BAR.x1 - BAR.x0, BAR.h, 8);
    const full = t > T.thousand;
    if (full) { stroke(255, 92, 138, 200 + 55 * Math.sin(t * 20)); strokeWeight(4); noFill(); rect(BAR.x0, BAR.y, BAR.x1 - BAR.x0, BAR.h, 8); noStroke(); }
    pop();
    // chunks: a queue that fills right → left; pushed out of the left end they fall INTO the dev's head
    const cap = 6;
    this.chunks.forEach((ch, i) => {
      if (t < ch.a) return;
      let slot = 0;
      for (let j = i + 1; j < this.chunks.length; j++) slot += E.outCubic(C01((t - this.chunks[j].a) / 0.16));
      const enter = E.outBack(C01((t - ch.a) / 0.18));
      let x = BAR.x1 - (slot + 1) * BAR.slot + 4, y = BAR.y + 5, s = 1, al = 1;
      if (enter < 1) { x = x + (1 - enter) * 60; y = y + (1 - enter) * 220; }
      if (slot > cap - 1) {   // overflow: arc down into the head and vanish
        const u = C01((slot - (cap - 1)) / 1.3), [hx, hy] = DEV.head;
        const sx0 = BAR.x0 - 10, sy0 = BAR.y;
        x = sx0 + (hx - 70 - sx0) * u; y = sy0 + (hy - 40 - sy0) * u - Math.sin(u * PI) * 120; s = 1 - 0.75 * u; al = 1 - C01((u - 0.8) / 0.2);
        if (u >= 1) return;
      }
      push(); translate(x + (BAR.slot - 8) / 2, y + (BAR.h - 10) / 2); scale(s); rotate(slot > cap - 1 ? (slot - cap) * 2.5 : 0);
      drawingContext.globalAlpha *= al;
      fill(ch.col); rect(-(BAR.slot - 8) / 2, -(BAR.h - 10) / 2, BAR.slot - 8, BAR.h - 10, 6);
      fill(Ex.C.ink); textFont(f.mono); textSize(15); textAlign(CENTER, CENTER); text(ch.label, 0, 1);
      pop();
    });
    if (t > T.tokens - 0.05) Ex.stamp(t, T.tokens - 0.05, "OVERFLOW", BAR.x0 + 250, BAR.y + 30, { font: f.title, size: 50, color: Ex.C.pink, rot: -0.12, t1: T.calm });
  },

  // head overload FX while chunks sink in
  headFX(t) {
    const T = this.T;
    if (t < T.thousand + 0.3 || t >= T.calm) return;
    const [hx, hy] = DEV.head, k = C01((t - T.thousand - 0.3) / 0.8);
    const g = drawingContext.createRadialGradient(hx, hy, 20, hx, hy, 230);
    g.addColorStop(0, `rgba(255,120,90,${0.28 * k * (0.7 + 0.3 * Math.sin(t * 16))})`); g.addColorStop(1, "rgba(255,120,90,0)");
    push(); drawingContext.fillStyle = g; noStroke(); circle(hx, hy, 460);
    for (let i = 0; i < 4; i++) {   // steam puffs from the ears
      const ph = (t * 1.6 + i / 4) % 1, side = i % 2 ? 1 : -1;
      fill(240, 240, 245, 150 * (1 - ph) * k); circle(hx + side * (130 + ph * 60), hy - 20 - ph * 110, 26 + ph * 40);
    }
    pop();
  },

  hud(t) {   // Ctrl+C / Ctrl+V counter (screen space, 1920 units)
    const T = this.T, f = this.f;
    if (!this.capL) return;
    const mont = t < T.backE + 0.1, calm = C01((t - T.ctx + 0.2) / 0.3);   // bows out as the token bar takes the top of frame
    const m = mont ? 0 : E.inOutCubic(C01((t - T.backE - 0.1) / 0.4));
    const sc = 1 - 0.45 * m, bx = 1535 + (1605 - 1535) * m, by = 380 + (60 - 380) * m;
    push(); translate(bx, by); scale(sc); drawingContext.globalAlpha *= (1 - calm);
    [["C", this.capL, this.pressC, 0], ["V", this.capR, this.pressV, 200]].forEach(([k, im, list, dx]) => {
      const { n, d } = this.pressAmt(list, Math.min(t, T.calm));
      push(); translate(dx + 85, 90 + d * 12);
      if (d > 0) { noStroke(); fill(255, 181, 61, 120 * d); circle(0, 0, 230 * (0.8 + 0.2 * d)); }
      Ex.img(im, 0, 0, 150, { sy: 1 - 0.08 * d });
      fill(Ex.C.ink); textFont(f.title); textSize(26); textAlign(CENTER, CENTER); text("Ctrl", -18, -30);
      textSize(52); text(k, 20, -12);
      pop();
      fill(Ex.C.amber); textFont(f.title); textSize(56); textAlign(CENTER, TOP);
      push(); translate(dx + 85, 190); scale(1 + 0.25 * d); text("×" + n, 0, 0); pop();
    });
    pop();
  },

  // ---------------- montage ----------------
  wheelAngle(t) {
    const st = this.stations;
    let th = 0;
    for (let i = 1; i < st.length; i++) {
      if (t < st[i].t) break;
      const p = E.outBack(C01((t - st[i].t) / 0.22));
      th = -(st[i - 1].k + (st[i].k - st[i - 1].k) * p) * HALF_PI;
    }
    // after "back." the wheel runs away: an accelerating free spin as the iris opens
    const tb = this.T.backE;
    if (t > tb) th -= 4 * (t - tb) * (t - tb) * 6;
    return th;
  },
  montageCam(t) {
    const st = this.stations;
    let cur = st[0], i0 = 0;
    for (let i = 0; i < st.length; i++) if (t >= st[i].t) { cur = st[i]; i0 = i; }
    const dt = t - Math.max(0, cur.t);
    const punch = i0 > 0 ? 0.12 * Math.exp(-dt * 9) : 0;
    const r = (i0 % 2 ? 1 : -1) * (0.12 - dt * 0.12) + Math.sin(t * 3) * 0.03;
    return { x: cur.cam.x + dt * 14 * (i0 % 2 ? 1 : -1), y: cur.cam.y, z: cur.cam.z * (1 + punch + dt * 0.04), r };
  },

  world(t) {
    const T = this.T;
    if (this.plate) { imageMode(CORNER); image(this.plate, 0, 0, W, H); }
    // main screen
    const schema = t >= T.now && t < T.chat - 0.25;
    if (schema) this.schemaPanel(t); else this.chatUI(t, this.chatMsgs(t), { dim: t >= T.calm ? 0.35 : 0 });
    this.sideScreen(t);
    this.paperStream(t);
    if (schema && t > T.schema) Ex.stamp(t, T.schema, "SCHEMA MISMATCH", MAIN.x + MAIN.w / 2, MAIN.y + 26, { font: this.f.title, size: 44, color: Ex.C.pink, rot: -0.06, t1: T.chat - 0.3 });
    // Chatty pops out of the chat for ch02, then zips back in on "Now"
    if (t > T.I - 0.2 && t < T.now + 0.3) {
      const pin = E.outBack(C01((t - T.I + 0.2) / 0.3)), pout = E.inCubic(C01((t - T.now) / 0.3));
      const s = pin * (1 - pout), ci = (t - 5.98) * 24 - CHAT_DELAY, im = this.sorry.frame(ci);
      const x = CHAT.x + (1100 - CHAT.x) * pout, y = CHAT.y - 60 * pout;
      if (s > 0.01) this.put(im, BB.chat, x, y, CHAT.h * s, { rot: -0.3 * pout, zc: CHAT_Z(Math.max(0, ci) / 24), zp: CHAT_ZP });
    }
    // Py and Reacty (still puppets) during the schema fight
    if (t > T.now && t < T.chat + 0.2) {
      const t1 = T.chat - 0.3;
      const lastPy = Math.max(-9, ...this.throws.filter((h) => h.dir > 0 && t >= h.t0).map((h) => h.t0));
      const lastAt = Math.max(-9, ...this.throws.filter((h) => h.dir < 0 && t >= h.t0 + h.dur - 0.05).map((h) => h.t0 + h.dur));
      const flick = Math.exp(-(t - lastPy) * 7), catchS = Math.exp(-(t - lastAt) * 8);
      const inP = E.outBack(C01((t - T.now - 0.05) / 0.35)), outP = C01((t - t1) / 0.3);
      const pyS = inP * (1 - outP);
      if (pyS > 0.01) {
        const w = Math.sin(t * 5);
        this.put(this.py, BB.py, PY.x, PY.y + 40 * outP, PY.h * pyS * (1 + 0.015 * w), { rot: -0.2 * flick + 0.02 * w });
        this.pill(PY.x - 60, PY.y + 22, "backend · FastAPI", Ex.C.pyBlue, t, T.now + 0.3);
      }
      const inA = E.outBack(C01((t - T.now - 0.15) / 0.35));
      const atS = inA * (1 - outP);
      if (atS > 0.01) {
        const jit = Math.sin(t * 31) * 3;   // hyperactive re-render jitter + a faint double
        push(); drawingContext.globalAlpha *= 0.25; this.put(this.atom, BB.atom, ATOM.x + 10 + jit, ATOM.y - 6, ATOM.h * atS); pop();
        this.put(this.atom, BB.atom, ATOM.x + jit * 0.5 - 18 * catchS, ATOM.y + Math.sin(t * 6) * 8, ATOM.h * atS, { sx: 1 + 0.08 * catchS, sy: 1 - 0.06 * catchS, rot: 0.12 * catchS });
        this.pill(ATOM.x + 40, ATOM.y + 20, "frontend · React", "#1E7FA0", t, T.now + 0.45);
      }
      this.sheets(t);
    }
    this.elephant(t);
    // the developer (H3 dev_frantic, ping-pong looped, frozen on the calm)
    const df = this.devFrame(t), im = df.im, jolt = t < T.calm ? 0.012 * Math.sin(t * 23) : 0;
    const absorb = t > T.thousand && t < T.calm ? 0.03 * Math.abs(Math.sin((t - T.thousand) * 16)) : 0;
    this.put(im, BB.dev, DEV.x, DEV.y, DEV.h, { flip: true, rot: jolt, sx: 1 + absorb * 0.5, sy: 1 + absorb, zc: df.z, zp: DEV_ZP });
    this.headFX(t);
    this.tokenBar(t);
    // version chaos around the dev's pasted files
    if (t > T.forget && t < T.ctx) this.versions(t);
    // calm hold: lights dim a touch, the prof is simply there, deadpan
    if (t >= T.calm) {
      noStroke(); fill(8, 10, 22, 70 * C01((t - T.calm) / 0.25)); rect(0, 0, W, H);
      this.put(this.prof, BB.prof, PROF.x, PROF.y, PROF.h, {});
      this.put(im, BB.dev, DEV.x, DEV.y, DEV.h, { flip: true, zc: df.z, zp: DEV_ZP });   // the dev stays lit
      if (t > T.you) {
        const p = C01((t - T.you) / 0.5), [hx, hy] = DEV.head;
        push(); stroke(Ex.C.amber); strokeWeight(5); noFill(); drawingContext.setLineDash([16, 12]);
        drawingContext.globalAlpha *= p; circle(hx, hy - 10, 360 * (0.9 + 0.1 * p)); drawingContext.setLineDash([]); pop();
        Ex.chalk("context window: you", 560, 300, { font: this.f.hand, size: 44, progress: (t - T.you) / 0.35, color: Ex.C.amber });
        Ex.arrow(700, 316, hx + 150, hy - 120, (t - T.you - 0.15) / 0.3, { color: Ex.C.amber, weight: 4, bend: 40, seed: 3 });
      }
    }
  },

  versions(t) {
    const T = this.T, f = this.f, [hx, hy] = DEV.head;
    const V = [["Form.jsx", T.forget], ["Form_v2.jsx", T.forget + 0.25], ["Form_final.jsx", T.version], ["Form_final_2.jsx", T.version + 0.3],
      ["Form_final_REAL.jsx", T.pasted], ["Form (1).jsx", T.pasted + 0.3]];
    V.forEach(([s, t0], i) => {
      const p = E.outBack(C01((t - t0) / 0.3)), out = C01((t - T.ctx + 0.4) / 0.3);
      if (p <= 0) return;
      const a = t * 0.9 + i * 1.05, rx = 250, ry = 118;
      const x = hx + 40 + Math.cos(a) * rx, y = hy - 40 + Math.sin(a) * ry;
      push(); translate(x, y); scale(p * (1 - out)); rotate(Math.sin(t * 3 + i) * 0.15);
      textFont(f.mono); textSize(17); const w = Ex.tw(s) + 26;
      noStroke(); fill(246, 238, 220, 240); rect(-w / 2, -18, w, 36, 6); fill(Ex.C.ink); textAlign(LEFT, CENTER); Ex.text(s, -w / 2 + 13, 0);
      pop();
    });
    const q = C01((t - T.version) / 0.2);
    if (q > 0) { textFont(f.black); textSize(80); fill(255, 92, 138, 230 * q * (1 - C01((t - T.ctx + 0.4) / 0.3))); textAlign(CENTER, CENTER); text("?", hx + 260 + Math.sin(t * 7) * 6, hy - 170); }
  },

  chatMsgs(t) {
    const T = this.T;
    if (t < T.chat - 0.25) return [
      { t0: -9, role: "user", kind: "text", text: "My FastAPI signup endpoint returns 500. Fix it?" },
      { t0: -9, role: "bot", kind: "text", text: "Certainly! Here's an example:" },
      { t0: -9, role: "bot", kind: "code", file: "main.py", lines: ['@app.post("/users")', "def create_user(user: UserIn):", "    return crud.create(db, user)"], sel: [T.copy1, T.run] },
      { t0: T.paste2 + 0.12, role: "user", kind: "err", lines: ["Traceback (most recent call last):", '  File "main.py", in create_user', "KeyError: 'email'"] },
      { t0: T.I, role: "bot", kind: "text", text: "I apologize for the confusion. Here's the corrected code.", type: [T.I, T.code] },
      { t0: T.heres + 0.3, role: "bot", kind: "code", file: "main.py", lines: ['@app.post("/users")', "def create_user(user: UserCreate):", "    return crud.create(db, user)"] }
    ];
    // "The chat forgets your models": the oldest messages grey out and drop out of context
    const fade = (t0) => (tt) => 1 - 0.82 * C01((tt - t0) / 0.35);
    return [
      { t0: -9, role: "user", kind: "code", file: "models.py", lines: ["class User(Base):", "    email_address = Column(String)"], alpha: fade(T.forgets), tag: "out of context", tagAt: T.forgets + 0.1 },
      { t0: -9, role: "user", kind: "code", file: "schemas.py", lines: ["class UserCreate(BaseModel):", "    email: str"], alpha: fade(T.forgets + 0.3), tag: "out of context", tagAt: T.forgets + 0.4 },
      { t0: -9, role: "bot", kind: "text", text: "I apologize for the confusion. Here's the corrected code.", alpha: fade(T.models) },
      { t0: -9, role: "user", kind: "code", file: "Form.jsx", lines: ['<input name="emailAddress" />'] },
      { t0: T.forget, role: "user", kind: "code", file: "Form_v2.jsx", lines: ['<input name="email" />'] },
      { t0: T.version, role: "user", kind: "code", file: "Form_final.jsx", lines: ['<input name="email_address" />'] },
      { t0: T.pasted, role: "user", kind: "code", file: "Form_final_REAL.jsx", lines: ['<input name="emailAddress" />'] }
    ];
  },

  draw(t) {
    const T = this.T, f = this.f, K = width / W;
    background(Ex.C.ink);
    push(); scale(K);
    const montage = t < T.backE + 0.55;
    // ---- camera (full frame after the montage) ----
    const sway = (amp, fr) => amp * Math.sin(t * fr);
    let cam = Ex.cam(t, [
      { t: T.backE + 0.1, x: 1080, y: 500, z: 1.85 },
      { t: T.backE + 0.6, x: 900, y: 500, z: 1.3, ease: "outCubic" },
      { t: T.conf, x: 895, y: 502, z: 1.32, ease: "linear" },
      { t: T.conf + 0.3, x: 880, y: 505, z: 1.36, ease: "outExpo" },
      { t: T.heres, x: 880, y: 505, z: 1.36, ease: "linear" },
      { t: T.heres + 0.5, x: 930, y: 520, z: 1.2, ease: "outCubic" },
      { t: T.now, x: 935, y: 525, z: 1.2, ease: "linear" },
      { t: T.now + 0.45, x: 1150, y: 560, z: 1.08, ease: "outCubic" },
      { t: T.match - 0.02, x: 1150, y: 560, z: 1.1, ease: "linear" },
      { t: T.match + 0.25, x: 1060, y: 510, z: 1.2, ease: "outExpo" },
      { t: T.so, x: 1065, y: 510, z: 1.21, ease: "linear" },
      { t: T.so + 0.4, x: 1150, y: 540, z: 1.1, ease: "outCubic" },
      { t: T.too + 0.3, x: 1150, y: 540, z: 1.12, ease: "linear" },
      { t: T.chat + 0.2, x: 1010, y: 480, z: 1.18, ease: "inOutCubic" },
      { t: T.forgets, x: 1005, y: 480, z: 1.2, ease: "linear" },
      { t: T.forgets + 0.35, x: 990, y: 480, z: 1.26, ease: "outCubic" },
      { t: T.forget - 0.05, x: 985, y: 480, z: 1.26, ease: "linear" },
      { t: T.forget + 0.35, x: 800, y: 520, z: 1.22, ease: "outCubic" },
      { t: T.ctx - 0.3, x: 790, y: 520, z: 1.24, ease: "linear" },
      { t: T.ctx + 0.2, x: 960, y: 520, z: 1.04, ease: "outCubic" },
      { t: T.thousand, x: 940, y: 520, z: 1.07, ease: "linear" },
      { t: T.tokens + 0.3, x: 760, y: 500, z: 1.28, ease: "outCubic" },
      { t: T.calm - 0.01, x: 740, y: 500, z: 1.33, ease: "linear" },
      { t: T.calm + 0.1, x: 960, y: 540, z: 1.0, ease: "outExpo" },
      { t: 26, x: 960, y: 540, z: 1.0, ease: "linear" }
    ]);
    // an anxious roll that keeps building through p12, then stops dead on "real"
    const amp = t < T.now ? 0.035 : t < T.chat ? 0.03 + 0.02 * C01((t - T.now) / 4) : t < T.ctx ? 0.02 : 0.03 + 0.04 * C01((t - T.ctx) / 3);
    cam.r = t >= T.calm ? 0 : sway(amp, 2.4 + 0.25 * t);
    cam = this.clampCam(cam);
    const shake = t > T.tb1 && t < T.tb1 + 0.25 ? [Math.sin(t * 110) * 12, Math.cos(t * 97) * 6] : [0, 0];

    if (montage) {
      // iris: full frame at t=0 (= s05 end camera), closes to the porthole on "Copy.", opens after "back."
      const irisIn = E.inOutCubic(C01(t / Math.max(0.1, T.copy1))), irisOut = E.inCubic(C01((t - T.backE) / 0.5));
      const R = R_PORT + (1150 - R_PORT) * Math.max(1 - irisIn, irisOut);
      // vortex backdrop, accelerating
      const spin = 0.8 * t + 0.32 * t * t;
      push(); translate(960, 540); rotate(spin); noStroke();
      for (let i = 0; i < 24; i++) { fill(i % 2 ? "#1F2338" : "#141726"); arc(0, 0, 2600, 2600, (i * TWO_PI) / 24, ((i + 1) * TWO_PI) / 24); }
      stroke(255, 181, 61, 70); strokeWeight(3);
      for (let i = 0; i < 18; i++) { const a = i * 0.35 + t * 2, r0 = 520 + ((t * 900 + i * 97) % 500); line(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * (r0 + 90), Math.sin(a) * (r0 + 90)); }
      pop();
      // world through the porthole
      const mix = (a, b, u) => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u, r: (a.r || 0) * (1 - u) + (b.r || 0) * u });
      let pc;
      if (t < T.copy1) pc = mix(S05_END, this.clampCam(this.stations[0].cam, R_PORT), irisIn);
      else if (irisOut > 0) pc = mix(this.clampCam(this.montageCam(t), R_PORT), cam, irisOut);
      else pc = this.clampCam(this.montageCam(t), R);
      push(); drawingContext.save(); drawingContext.beginPath(); drawingContext.arc(960, 540, R, 0, TWO_PI); drawingContext.clip();
      this.withCam(pc, () => this.world(t), shake);
      drawingContext.restore(); pop();
      // the wheel ring
      const ringA = 1 - irisOut;
      if (ringA > 0.01) {
        const th = this.wheelAngle(t), active = this.stations.filter((s) => t >= s.t).pop();
        push(); translate(960, 540); drawingContext.globalAlpha *= ringA;
        noFill(); stroke("#0E1020"); strokeWeight(74); circle(0, 0, (R + 36) * 2);
        stroke(Ex.C.amber); strokeWeight(4); circle(0, 0, R * 2 + 2); circle(0, 0, (R + 72) * 2);
        for (let i = 0; i < 48; i++) { const a = th + (i * TWO_PI) / 48; stroke(255, 181, 61, 90); strokeWeight(2); line(Math.cos(a) * (R + 62), Math.sin(a) * (R + 62), Math.cos(a) * (R + 70), Math.sin(a) * (R + 70)); }
        noStroke(); textFont(f.title); textAlign(CENTER, CENTER);
        ["COPY", "PASTE", "RUN", "TRACEBACK"].forEach((s, i) => {
          const a = -HALF_PI + i * HALF_PI + th, on = active && active.k % 4 === i && t >= this.stations[1].t;
          const low = C01((0.93 + Math.cos(a + HALF_PI)) / 0.3);   // 0 at the bottom of the ring, behind the caption
          push(); rotate(a + HALF_PI); translate(0, -(R + 37)); drawingContext.globalAlpha *= low;
          fill(on ? (i === 3 ? "#FF5C6C" : Ex.C.amber) : "rgba(243,239,228,0.45)"); textSize(on ? 44 : 34); text(s, 0, 2);
          pop();
          push(); rotate(a + HALF_PI + PI / 4); translate(0, -(R + 37)); fill(255, 181, 61, 150); circle(0, 0, 10); pop();
        });
        // pointer notch at the top
        fill(Ex.C.amber); triangle(-18, -(R + 88), 18, -(R + 88), 0, -(R + 66));
        pop();
        // word slam on the left
        if (active && active.word) {
          const dt = t - active.t, p = C01(dt / 0.12), s = 1.6 - 0.6 * E.outCubic(p);
          push(); translate(250, 520); rotate(-0.08); scale(s); drawingContext.globalAlpha *= Math.min(1, p * 3) * ringA;
          textFont(f.title); let ts = 150; textSize(ts); const tw = Ex.tw(active.word); if (tw > 420) { ts *= 420 / tw; textSize(ts); }
          fill(active.word.startsWith("TRACE") ? "#FF5C6C" : Ex.C.amber); textAlign(CENTER, CENTER); text(active.word, 0, 0);
          if (active.sub) { textFont(f.hand); textSize(40); fill(Ex.C.chalk); text(active.sub, 0, ts * 0.62); }
          pop();
        }
      }
    } else {
      this.withCam(cam, () => this.world(t), shake);
    }
    // traceback banner (screen space) on the first "Traceback."
    if (t > T.tb1 && t < T.copy2) {
      const p = E.outBack(C01((t - T.tb1) / 0.2)), q = 1 - C01((t - T.copy2 + 0.25) / 0.25);
      push(); translate(960, 930); scale(p); drawingContext.globalAlpha *= q; noStroke(); fill(40, 8, 16, 225); rect(-470, -44, 940, 88, 12);
      if (this.warn) Ex.img(this.warn, -415, 0, 70);
      fill("#FF5C6C"); textFont(f.mono); textSize(34); textAlign(LEFT, CENTER); Ex.text("Traceback (most recent call last):", -365, 2); pop();
    }
    this.hud(t);
    Ex.card(t, T.chat + 0.1, T.chat + 0.1 + 3.7, 34, 30, 540, { fonts: { tag: f.tag, title: f.title, body: f.bodyR, cite: f.bodyR }, size: 19,
      title: "Q&A after ChatGPT: −25%",
      body: "Within 6 months of ChatGPT's release, Stack Overflow activity fell 25% relative to its Russian and Chinese counterparts and to maths forums: a difference-in-differences estimate the authors call a lower bound.",
      cite: "del Rio-Chanona, Laurentsyeva & Wachs, PNAS Nexus 3(9): pgae400 (2024)" });
    pop();
    Ex.caption(t, this.ph, { font: f.body, size: 34, speakers: { prof: "#FFFFFF", chat: Ex.C.chat } });
    Ex.vignette(t >= T.calm ? 0.42 : 0.3);
  }
});
