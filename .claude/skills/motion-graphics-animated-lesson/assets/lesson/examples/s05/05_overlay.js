// s05 ChatGPT arrives (song 90.958–111.292 s, frames 2183–2671; t is section-local, 20.333 s). Plate = s05/desk2022, redrawn
// inside the camera (world 1920×1080 units).
// p10 0.48–13.68 prof VO: "Then, November thirtieth: ChatGPT. A million users in five days. And for our React, FastAPI and
//   Postgres developer, the workflow became... this."  d01 14.02–17.86 Luca (H3 dev_ask, audio_at 13.74).
//   ch01 18.06–20.14 Chatty (H3 chat_certainly, audio_at 17.79) pops OUT of the monitor with confetti.
// Join: prompts/s04/05_overlay.js did not exist when this was written, so the section opens with a wipe from black (ink) at the
// neutral key (960, 540, z 1.0). The last key (990, 530, z 1.2) is the handoff to s06, which reuses this plate.
//
// Plate landmarks (world units, measured on 02_kf_desk2022.png): main monitor screen x763–1440 y319–658; second monitor
// x1469–1786 y373–678; desk top edge y≈765; books x634–854 y≈715–790; mug x1627–1776; lamp x1740–1920; left third empty wall.
// Facts (RESEARCH A10, A12): ChatGPT introduced 30 Nov 2022 (a Wednesday); Altman 5 Dec 2022 "today it crossed 1 million users!";
// InstructGPT 1.3B preferred to 175B GPT-3 (Ouyang et al. 2022, arXiv:2203.02155). Code on screen is illustrative only.
const W = 1920, H = 1080;
const MON = { x: 772, y: 328, w: 660, h: 322 };        // inner screen rect (inset from the bezel)
// Luca: dev_type / dev_ask source frame drawn DEV.w wide with its top-left at (x, y). dev_ask has an uncommanded H3 push-in
// (≈1.72× over its first 2 s, measured from the green-key extents at 8 fps: width 230 → 397 px of 960) about the normalised
// source point (0.5146, 0.2252), just above his hair parting. Each frame is drawn at 1/z(t) about that point, so Luca keeps the
// keyframe size; the clip's own bottom edge then lands at world y≈1055, below every camera view while the clip plays.
const DEV = { x: -788, y: 227, w: 2200, ax: 0.5146, ay: 0.2252 };   // clip bottom edge → world y≈1055 (views end ≤ 1030 while it plays)
const DEV_Z = [[0, 1], [0.125, 1.03], [0.25, 1.078], [0.375, 1.148], [0.5, 1.278], [0.625, 1.413], [0.75, 1.5], [0.875, 1.57],
  [1, 1.609], [1.125, 1.639], [1.25, 1.657], [1.375, 1.67], [1.5, 1.687], [1.625, 1.696], [1.75, 1.713], [1.875, 1.726], [2, 1.73]];
// Chatty: chat_certainly drifts ≈1.15× (mostly pose) and its thruster leaves the frame bottom, so he is drawn leaning OUT of the
// monitor: everything below the screen's lower edge (world y 652) is clipped, which also hides the cropped thruster.
const CHAT = { x: 1059, y: 240, w: 825 };
const CHAT_C = { x: 1480, y: 470 };                    // Chatty's body centre for the pop-out
const CHAT_CLIP_Y = 652;
const lerpTab = (tab, x) => {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) if (x < tab[i][0]) { const [a, va] = tab[i - 1], [b, vb] = tab[i]; return va + ((vb - va) * (x - a)) / (b - a); }
  return tab[tab.length - 1][1];
};
const CAL0 = { x: 420, y: 250, h: 320 }, CAL1 = { x: 628, y: 190, h: 150 };
const REACTY = { x: 1612, y: 330, h: 200 }, PY = { x: 1505, y: 905, h: 250 }, ELE = { x: 725, y: 780, h: 170 };
const PROMPT = "Write a FastAPI endpoint that saves a note to Postgres.";
const TABS = {
  React: { lang: "js", color: "#61DAFB", code: [
    "function Notes() {",
    "  const [notes, setNotes] = useState([]);",
    "  useEffect(() => {",
    "    fetch(\"/notes\").then((r) => r.json()).then(setNotes);",
    "  }, []);",
    "  return <NoteList notes={notes} />;"] },
  FastAPI: { lang: "py", color: "#3776AB", code: [
    "app = FastAPI()",
    "",
    "@app.post(\"/notes\")",
    "def create_note(note: NoteIn):",
    "    # TODO: save it to Postgres... somehow",
    "    ..."] },
  psql: { lang: "sql", color: "#336791", code: [
    "notes=# SELECT * FROM notes;",
    " id | body | pinned",
    "----+------+--------",
    "(0 rows)",
    "",
    "notes=# "] }
};
const REPLY = [
  "@app.post(\"/notes\")",
  "def create_note(note: NoteIn):",
  "    db.add(Note(**note.dict()))",
  "    db.commit()",
  "    return {\"ok\": True}"];

// centred / left text that keeps spaces (p5 + opentype measure " " as 0 wide)
const ctext = (str, x, y) => { const v = textAlign().vertical; push(); textAlign(LEFT, v); Ex.text(str, x - Ex.tw(str) / 2, y); pop(); };

// Monospace code renderer: Ex.code advances by textWidth(token), which p5 + opentype return as ≈0 for punctuation ("." "(" "|"),
// so tokens overlapped. Here every character advances one fixed cell (textWidth("M")).
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
    this.f = await Anim.fonts({ tag: "din-alt.ttf", title: "din-cond.ttf", body: "body-med.ttf", bodyR: "body.ttf",
      black: "body-black.ttf", mono: "mono-andale.ttf" });   // SFNSMono (variable) drops . and ( glyphs in p5
    const img = (p) => new Promise((ok) => loadImage(p, ok, () => ok(null)));
    this.plate = await img("/output/s05/02_kf_desk2022.png");
    this.cal = await img("/output/props-a-v1/sprites/calendar.png");
    this.ele = await img("/output/props-d-v1/sprites/elephant.png");
    this.devStill = await Anim.clip("dev_type");
    this.ask = await Anim.clip("dev_ask");
    this.cert = await Anim.clip("chat_certainly");
    // stills are full keyframes: crop to the character bounds (measured on 02_kf_*.png, 2752×1536)
    const crop = async (name, x, y, w, h) => { const c = await Anim.clip(name); const f = c.frame(0); const k = f.width / 2752; return f.get(x * k, y * k, w * k, h * k); };
    this.py = await crop("py_idle", 880, 60, 1040, 1350);
    this.atom = await crop("atom_idle", 700, 170, 1360, 1130);
    // section words carry no speaker/line: split by time (d01 14.02–17.86 dev, ch01 from 18.06 chat)
    this.words = Anim.data("words").map((w) => {
      const sp = w.s >= 18.0 ? "chat" : w.s >= 13.9 ? "dev" : "prof";
      return { ...w, speaker: sp, line: { prof: "p10", dev: "d01", chat: "ch01" }[sp] };
    });
    this.cue = Anim.cues(this.words);
    this.ph = Ex.phrases(this.words).map((p, i, a) => (a[i + 1] ? { ...p, e: Math.min(p.e, a[i + 1].s - 0.45) } : p));
    this.devWords = this.words.filter((w) => w.speaker === "dev");
  },

  // ---------- calendar: Nov 30 (Wed) → flips 5 pages to Dec 5 while the counter spins ----------
  calendar(t, T) {
    if (!this.cal || t < T.nov) return;
    const move = Anim.ease.inOutCubic(Anim.clamp01((t - T.and) / 0.6));
    const x = CAL0.x + (CAL1.x - CAL0.x) * move, y = CAL0.y + (CAL1.y - CAL0.y) * move, h = CAL0.h + (CAL1.h - CAL0.h) * move;
    // ducks out while the "OUR DEVELOPER" lower third holds the top-left, pops back on "this"
    const duck = Anim.clamp01((t - (T.dev - 0.35)) / 0.3) * (1 - Anim.ease.outBack(Anim.clamp01((t - T.this) / 0.4)));
    const popS = Anim.ease.outBack(Anim.clamp01((t - T.nov) / 0.4)) * (1 - duck);
    if (popS <= 0.01) return;
    const w = (h * this.cal.width) / this.cal.height;
    const flipDur = (T.daysE - T.a) / 5;
    const n = t < T.a ? -1 : Math.floor((t - T.a) / flipDur);            // flips started
    const frac = n >= 0 && n < 5 ? ((t - T.a) - n * flipDur) / flipDur : 1;
    const page = (i) => (i === 0 ? { m: "NOV", d: "30", wd: "WED" } : { m: "DEC", d: String(i), wd: ["THU", "FRI", "SAT", "SUN", "MON"][i - 1] });
    push(); translate(x, y); scale(popS);
    Ex.img(this.cal, 0, 0, h);
    // page face in sprite-relative units (x 0.10–0.80 of w, y 0.22–0.83 of h)
    const px = -w / 2 + w * 0.1, py = -h / 2 + h * 0.22, pw = w * 0.7, phh = h * 0.61;
    const drawPage = (p, alpha = 1) => {
      push(); drawingContext.globalAlpha *= alpha;
      noStroke(); fill(Ex.C.paper); rect(px, py, pw, phh, 4);
      fill(Ex.C.pink); rect(px, py, pw, phh * 0.22, 4, 4, 0, 0);
      fill("#FFFFFF"); textFont(this.f.title); textAlign(CENTER, CENTER); textSize(phh * 0.18); ctext(p.m + " 2022", px + pw / 2, py + phh * 0.115);
      fill(Ex.C.ink); textFont(this.f.black); textSize(phh * 0.5); text(p.d, px + pw / 2, py + phh * 0.56);
      fill("rgba(27,26,34,0.6)"); textFont(this.f.tag); textSize(phh * 0.13); text(p.wd, px + pw / 2, py + phh * 0.88);
      pop();
    };
    if (n < 0) drawPage(page(0));
    else if (n >= 5) drawPage(page(5));
    else {                                // the old page lifts up toward the rings over the next one
      drawPage(page(n + 1));
      const k = 1 - Anim.ease.inCubic(frac);
      push(); translate(0, py); scale(1, k); translate(0, -py); drawPage(page(n)); pop();
      noStroke(); fill(0, 0, 0, 70 * (1 - k)); rect(px, py + phh * k, pw, 6);
    }
    pop();
    if (n >= 1 && n <= 5) Ex.burst(t, T.a + n * flipDur, x, y - h * 0.25, { n: 8, color: Ex.C.paper, dur: 0.35, dist: 80 * (h / 320), size: 6, seed: n });
  },

  // ---------- the main monitor: launch page → user counter → IDE tabs → chat UI ----------
  monitor(t, T) {
    if (t < T.chatgpt) return;
    const f = this.f, { x, y, w, h } = MON;
    push();
    drawingContext.save();
    drawingContext.beginPath(); drawingContext.rect(x, y, w, h); drawingContext.clip();
    const on = Anim.clamp01((t - T.chatgpt) / 0.12);
    noStroke(); fill(255, 255, 255, 255 * (1 - on)); rect(x, y, w, h);  // power-on flash
    if (t < T.a) this.launchPage(t, T, on);
    else if (t < T.and) this.counterPage(t, T);
    else if (t < T.this) this.ide(t, T);
    else this.chatUI(t, T);
    // a quick white flash on each page change
    for (const tc of [T.a, T.and, T.this]) { const k = 1 - Anim.clamp01(Math.abs(t - tc) / 0.12); if (k > 0) { fill(255, 255, 255, 200 * k); rect(x, y, w, h); } }
    drawingContext.restore();
    pop();
  },

  launchPage(t, T, on) {
    const f = this.f, { x, y, w, h } = MON;
    drawingContext.globalAlpha = on;
    noStroke(); fill("#FFFFFF"); rect(x, y, w, h);
    const s = Anim.ease.outBack(Anim.clamp01((t - T.chatgpt) / 0.4));
    push(); translate(x + w / 2, y + h * 0.36); scale(s);
    fill(Ex.C.chat); rect(-38, -30, 76, 56, 16); triangle(-26, 22, -8, 22, -32, 40);   // generic speech-bubble glyph (no logo)
    fill("#FFFFFF"); for (let i = -1; i <= 1; i++) circle(i * 18, -2, 9);
    pop();
    fill("#202123"); textFont(f.black); textAlign(CENTER, CENTER); textSize(44); ctext("Introducing ChatGPT", x + w / 2, y + h * 0.66);
    fill("#6E6E80"); textFont(f.bodyR); textSize(20); ctext("research preview · free to use", x + w / 2, y + h * 0.82);
    drawingContext.globalAlpha = 1;
  },

  counterPage(t, T) {
    const f = this.f, { x, y, w, h } = MON;
    noStroke(); fill("#101522"); rect(x, y, w, h);
    const p = Anim.clamp01((t - T.a) / (T.daysE - T.a));
    const v = Math.round(1e6 * Math.pow(p, 2.2));
    const done = p >= 1;
    fill(Ex.C.chalkDim); textFont(f.tag); textAlign(CENTER, CENTER); textSize(24); ctext("CHATGPT USERS", x + w / 2, y + 52);
    const pulse = done ? 1 + 0.06 * Math.sin((t - T.daysE) * 18) * Math.exp(-(t - T.daysE) * 3) : 1;
    push(); translate(x + w / 2, y + h * 0.47); scale(pulse);
    fill(done ? Ex.C.amber : Ex.C.chalk); textFont(f.black); textSize(104); text(v.toLocaleString("en-US"), 0, 0);
    pop();
    // growth bar
    fill("rgba(243,239,228,0.12)"); rect(x + 60, y + h * 0.7, w - 120, 12, 6);
    fill(Ex.C.chat); rect(x + 60, y + h * 0.7, (w - 120) * Math.pow(p, 2.2), 12, 6);
    if (t > T.daysE + 0.1) {
      fill("rgba(243,239,228,0.75)"); textFont(f.bodyR); textSize(17);
      ctext("“today it crossed 1 million users!”  Sam Altman, 5 Dec 2022", x + w / 2, y + h * 0.86);
    }
  },

  ide(t, T) {
    const f = this.f, { x, y, w, h } = MON;
    noStroke(); fill("#1B1F2B"); rect(x, y, w, h);
    fill("#DEE1E6"); rect(x, y, w, 40);
    const tabs = [["React", T.react], ["FastAPI", T.fast], ["psql", T.pg], ["ChatGPT", T.workflow]].filter(([, t0]) => t >= t0);
    const code = tabs.filter(([n]) => n !== "ChatGPT"), active = code.length ? code[code.length - 1][0] : null;
    tabs.forEach(([name, t0], i) => {
      const s = Anim.ease.outBack(Anim.clamp01((t - t0) / 0.3));
      const tx = x + 8 + i * 158, isA = name === active || (name === "ChatGPT" && Math.floor(t * 4) % 2 === 0);
      push(); translate(tx + 75, y + 24); scale(s, 1);
      fill(isA ? "#FFFFFF" : "#C9CDD4"); rect(-75, -18, 150, 34, 8, 8, 0, 0);
      fill(name === "ChatGPT" ? Ex.C.chat : name === "React" ? "#61DAFB" : name === "FastAPI" ? "#3776AB" : "#336791"); circle(-56, -1, 12);
      fill("#303540"); textFont(f.body); textSize(17); textAlign(LEFT, CENTER); text(name, -44, -2);
      pop();
    });
    if (!active) return;
    const tab = TABS[active], t0 = { React: T.react, FastAPI: T.fast, psql: T.pg }[active];
    codeMono(tab.code, x + 16, y + 58, { lang: tab.lang, font: f.mono, size: 17, progress: Anim.clamp01((t - t0) / 0.5), cursor: active === "psql" });
  },

  chatUI(t, T) {
    const f = this.f, { x, y, w, h } = MON;
    noStroke(); fill("#FFFFFF"); rect(x, y, w, h);
    // header
    fill("#F7F7F8"); rect(x, y, w, 34); fill("#8E8EA0"); textFont(f.body); textSize(15); textAlign(CENTER, CENTER); ctext("New chat", x + w / 2, y + 17);
    const sent = t >= T.enter;
    // typed prompt, word-synced to Luca's voice
    let typed = "";
    if (!sent) {
      const pw = PROMPT.split(" ");
      let n = 0;
      this.devWords.forEach((wd, i) => {
        if (t < wd.s || i >= pw.length) return;
        const before = pw.slice(0, i).join(" ").length + (i ? 1 : 0);
        n = Math.max(n, before + Math.round(pw[i].length * Anim.clamp01((t - wd.s) / Math.max(0.12, wd.e - wd.s))));
      });
      typed = PROMPT.slice(0, n);
    }
    if (!sent) {
      const c = Anim.ease.outBack(Anim.clamp01((t - T.this) / 0.35));
      push(); translate(x + w / 2, y + h * 0.36); scale(c);
      fill("#D9D9E3"); textFont(f.black); textAlign(CENTER, CENTER); textSize(46); text("ChatGPT", 0, 0);
      pop();
    }
    // input box
    const bx = x + 40, by = y + h - 62, bw = w - 80, bh = 44;
    drawingContext.shadowColor = "rgba(0,0,0,0.12)"; drawingContext.shadowBlur = 12;
    fill("#FFFFFF"); stroke("#D9D9E3"); strokeWeight(1.5); rect(bx, by, bw, bh, 10); noStroke();
    drawingContext.shadowColor = "transparent";
    textFont(f.bodyR); textSize(17); textAlign(LEFT, CENTER);
    if (typed) {
      fill("#202123"); const shown = typed; Ex.text(shown, bx + 16, by + bh / 2);
      textFont(f.bodyR); textSize(17);
      if (Math.floor(t * 3) % 2 === 0 || t < T.enter - 0.3) { fill("#202123"); rect(bx + 16 + Ex.tw(shown) + 3, by + 11, 2, bh - 22); }
    } else if (!sent) { fill("#8E8EA0"); Ex.text("Send a message...", bx + 16, by + bh / 2); }
    const glow = !sent && typed.length === PROMPT.length ? 1 : 0.35;
    fill(16, 163, 127, 255 * glow); rect(bx + bw - 38, by + 8, 28, 28, 6);
    fill("#FFFFFF"); triangle(bx + bw - 30, by + 15, bx + bw - 30, by + 29, bx + bw - 16, by + 22);
    if (!sent) return;
    // conversation: user row slides up, then the assistant row
    const up = Anim.ease.outCubic(Anim.clamp01((t - T.enter) / 0.3));
    const ry = y + 44 + (1 - up) * 160;
    fill("#8B6CFF"); rect(x + 18, ry, 26, 26, 5); fill("#FFFFFF"); textFont(f.black); textSize(15); textAlign(CENTER, CENTER); text("L", x + 31, ry + 13);
    fill("#343541"); textFont(f.bodyR); textSize(16); textAlign(LEFT, TOP);
    const pl = Ex.wrap(PROMPT, 330);
    pl.forEach((l, i) => Ex.text(l, x + 56, ry + 4 + i * 21));
    if (t < T.enter + 0.25) return;
    const ay = ry + 22 + pl.length * 21;
    fill("#F7F7F8"); rect(x, ay - 8, w, h - (ay - y) - 70);
    fill(Ex.C.chat); rect(x + 18, ay, 26, 26, 5); fill("#FFFFFF"); rect(x + 24, ay + 7, 14, 10, 3); triangle(x + 26, ay + 16, x + 30, ay + 16, x + 25, ay + 21);
    if (t < T.cert) {                      // thinking cursor
      if (Math.floor(t * 4) % 2 === 0) { fill("#343541"); rect(x + 58, ay + 4, 9, 18); }
      return;
    }
    const intro = "Certainly! Here's an example:";
    const k = Anim.clamp01((t - T.cert) / (T.exampleE - T.cert));
    fill("#343541"); textFont(f.body); textSize(16); textAlign(LEFT, TOP); Ex.text(intro.slice(0, Math.round(intro.length * k)), x + 56, ay + 4);
    if (t < T.here) return;
    const cy = ay + 30;
    const cw = 330;
    fill("#000000"); rect(x + 56, cy, cw, 26, 6, 6, 0, 0); fill("#8E8EA0"); textFont(f.bodyR); textSize(12); Ex.text("python", x + 66, cy + 6);
    fill("#1B1F2B"); rect(x + 56, cy + 26, cw, 112, 0, 0, 6, 6);
    codeMono(REPLY, x + 64, cy + 34, { font: f.mono, size: 14, progress: Anim.clamp01((t - T.here) / 1.4), gutter: false, cursor: t < T.here + 1.4 });
  },

  // ---------- characters ----------
  dev(t, T) {
    if (t < T.our) return;
    const live = t >= this.ask.audio_at;
    const im = live ? this.ask.at(t) : this.devStill.frame(0);
    const z = live ? lerpTab(DEV_Z, t - this.ask.audio_at) : 1;
    const e = Anim.ease.outBack(Anim.clamp01((t - T.our) / 0.45));
    const br = live ? 0 : 0.006 * Math.sin(t * 2 * Math.PI * 0.6);
    const fw = DEV.w, fh = (fw * im.height) / im.width;
    const axw = DEV.x + DEV.ax * fw, ayw = DEV.y + DEV.ay * fh;
    push();
    translate(axw, ayw + (1 - e) * 700);           // slides up into frame from below on "our"
    scale((1 - br * 0.5) / z, (1 + br) / z);
    imageMode(CORNER); image(im, -DEV.ax * fw, -DEV.ay * fh, fw, fh);
    pop();
  },

  chatty(t, T) {
    if (t < T.cert - 0.05) return;
    const p = Anim.clamp01((t - (T.cert - 0.05)) / 0.5), e = Anim.ease.outBack(p);
    const sx = MON.x + MON.w / 2, sy = MON.y + MON.h / 2;
    const cx = sx + (CHAT_C.x - sx) * Anim.ease.outCubic(p), cy = sy + (CHAT_C.y - sy) * Anim.ease.outCubic(p) - Math.sin(p * Math.PI) * 90;
    const s = 0.08 + 0.92 * e;
    const im = this.cert.at(t);
    push();
    drawingContext.save(); drawingContext.beginPath(); drawingContext.rect(0, 0, W, CHAT_CLIP_Y); drawingContext.clip();
    translate(cx, cy); scale(s); rotate((1 - p) * -0.5); translate(-CHAT_C.x, -CHAT_C.y);
    this.cert.place(im, CHAT.x, CHAT.y, CHAT.w);
    drawingContext.restore();
    pop();
  },

  // Reacty re-renders constantly: a cyan ghost double flickers beside it.
  reacty(t, T) {
    if (t < T.react) return;
    const o = { ...REACTY, t0: T.react, from: "pop", bob: 12, speed: 1.9, breathe: 0.03, anchor: "center", t1: T.certE };
    const g = (t - T.react) % 0.7;
    if (g < 0.1 && t < T.certE) { push(); tint(97, 218, 251, 110); Ex.puppet(this.atom, t, { ...o, x: o.x + 16, tilt: 0.08 }); pop(); }
    Ex.puppet(this.atom, t, { ...o, tilt: 0.08 * Math.sin(t * 5) });
  },

  py_(t, T) {
    if (t < T.fast) return;
    Ex.puppet(this.py, t, { ...PY, t0: T.fast, from: "bottom", bob: 4, speed: 0.8, breathe: 0.02, tilt: 0.05 * Math.sin(t * 1.7), t1: T.certE });
  },

  elephant(t, T) {
    if (!this.ele || t < T.pg) return;
    const up = Anim.ease.outBack(Anim.clamp01((t - T.pg) / 0.4)) - Anim.ease.inCubic(Anim.clamp01((t - T.this) / 0.4));
    if (up <= 0) return;
  const wob = Math.sin(t * 6) * 0.05;
  push(); drawingContext.save(); drawingContext.beginPath(); drawingContext.rect(0, 0, W, 770); drawingContext.clip();
  Ex.img(this.ele, ELE.x, ELE.y + ELE.h * 0.75 * (1 - up), ELE.h, { rot: wob, anchor: "bottom" });
  drawingContext.restore(); pop();
  // redraw the books in front so it peeks up from behind them
  const k = this.plate.width / W, x0 = 630, x1 = 860, y0 = 712, y1 = 800;
  imageMode(CORNER);
  image(this.plate, x0, y0, x1 - x0, y1 - y0, x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k);
},

  labels(t, T) {
    const f = this.f;
    const pill = (str, x, y, t0, color) => {
      const a = Anim.clamp01((t - t0) / 0.25) * (1 - Anim.clamp01((t - T.this) / 0.3));
      if (a <= 0) return;
      push(); drawingContext.globalAlpha = a; textFont(f.tag); textSize(22); textAlign(CENTER, CENTER);
      const tw = Ex.tw(str) + 46; noStroke(); fill(16, 21, 34, 225); rect(x - tw / 2, y - 18, tw, 36, 18);
      fill(color); circle(x - tw / 2 + 17, y, 9); fill(Ex.C.chalk); ctext(str, x + 9, y + 1);   // dot clear of the text
      pop();
    };
    pill("REACT · frontend", REACTY.x - 60, REACTY.y + 128, T.react + 0.2, Ex.C.react);
    pill("FASTAPI · Python backend", PY.x - 250, PY.y - 140,   /* left of Py: below it was clipped by the frame edge */ T.fast + 0.2, Ex.C.pyYellow);
    pill("POSTGRES · database", ELE.x, ELE.y - ELE.h - 34, T.pg + 0.3, "#7FA6D6");
  },

  confetti(t, t0, x, y) {
    const d = t - t0; if (d < 0 || d > 2.4) return;
    const r = Anim.rng(42), cols = [Ex.C.chat, Ex.C.amber, Ex.C.pink, Ex.C.react, Ex.C.phd, Ex.C.chalk];
    push(); noStroke();
    for (let i = 0; i < 70; i++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 2.6, v = 520 + r() * 620, spin = (r() - 0.5) * 14, c = cols[i % cols.length];
      const px = x + Math.cos(a) * v * d * 0.9, py = y + Math.sin(a) * v * d + 700 * d * d;
      const sz = 8 + r() * 10;
      drawingContext.globalAlpha = 1 - Anim.clamp01((d - 1.6) / 0.8);
      push(); translate(px, py); rotate(spin * d); scale(1, Math.cos(d * (6 + r() * 6))); fill(c); rect(-sz / 2, -sz * 0.3, sz, sz * 0.6, 2); pop();
    }
    pop();
    const ring = Anim.clamp01(d / 0.35);
    if (ring < 1) { push(); noFill(); stroke(255, 255, 255, 230 * (1 - ring)); strokeWeight(10 * (1 - ring) + 1); circle(x, y, 60 + ring * 520); pop(); }
  },

  monitorGlow(t, T) {
    if (t < T.chatgpt) return;
    const a = Anim.clamp01((t - T.chatgpt) / 0.3) * (t >= T.this ? 0.34 : t >= T.and ? 0.2 : t >= T.a ? 0.18 : 0.3);
    const cx = MON.x + MON.w / 2, cy = MON.y + MON.h / 2;
    const col = t >= T.this || t < T.a ? "215,235,255" : "120,150,220";
    const g = drawingContext.createRadialGradient(cx, cy, 200, cx, cy, 720);
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
    push(); drawingContext.globalCompositeOperation = "screen"; drawingContext.fillStyle = g; noStroke(); rect(0, 0, W, H); pop();
  },

  draw(t) {
    const f = this.f, c = this.cue, K = width / W;
    const T = {
      nov: c("November").s, chatgpt: c("ChatGPT.").s, a: c("A").s, days: c("days.").s, daysE: c("days.").e,
      and: c("And").s, our: c("our").s, react: c("React,").s, fast: c("FastAPI").s, pg: c("Postgres").s, dev: c("developer,").s,
      workflow: c("workflow").s, became: c("became...").s, this: c("this.").s, write: c("Write").s,
      enter: c("Postgres.", 2).e + 0.12, cert: c("Certainly!").s, here: c("Here's").s, exampleE: c("example.").e
    };
    T.certE = 99;
    background(Ex.C.ink);
    // wipe-in at the neutral key → push to calendar + counter → wide for the stack → push into the monitor → snap on "this."
    // → pull back to frame Luca + chat for d01 → punch on "Certainly!". Keys clamped: |x-960| ≤ 960-960/z, |y-540| ≤ 540-540/z.
    const cam = Ex.cam(t, [
      { t: 0, x: 960, y: 540, z: 1.0 },
      { t: T.nov - 0.1, x: 945, y: 530, z: 1.03, ease: "linear" },
      { t: T.nov + 0.5, x: 790, y: 445, z: 1.22, ease: "outCubic" },
      { t: T.and - 0.05, x: 800, y: 448, z: 1.24, ease: "linear" },
      { t: T.and + 0.6, x: 960, y: 540, z: 1.0, ease: "inOutCubic" },
      { t: T.workflow, x: 965, y: 535, z: 1.02, ease: "linear" },
      { t: T.this - 0.05, x: 1070, y: 505, z: 1.28, ease: "inOutCubic" },
      { t: T.this + 0.15, x: 1100, y: 490, z: 1.45, ease: "outExpo" },
      { t: T.write - 0.25, x: 1098, y: 492, z: 1.46, ease: "linear" },
      { t: T.write + 0.55, x: 840, y: 560, z: 1.15, ease: "inOutCubic" },
      { t: T.cert - 0.05, x: 850, y: 556, z: 1.16, ease: "linear" },
      { t: T.cert + 0.3, x: 990, y: 530, z: 1.2, ease: "outExpo" },
      { t: 20.34, x: 990, y: 530, z: 1.2, ease: "linear" }
    ]);
    const shake = t > T.cert && t < T.cert + 0.25 ? [Math.sin(t * 110) * 8 * (1 - (t - T.cert) / 0.25), 0] : [0, 0];
    Ex.withCam({ ...cam, z: cam.z * K }, () => {
      if (this.plate) { imageMode(CORNER); image(this.plate, 0, 0, W, H); }
      this.elephant(t, T);
      this.monitorGlow(t, T);
      this.monitor(t, T);
      this.calendar(t, T);
      this.reacty(t, T);
      this.py_(t, T);
      this.dev(t, T);
      this.labels(t, T);
      Ex.stamp(t, T.chatgpt + 0.15, "30 NOV 2022", MON.x + 150, MON.y + 50, { font: f.title, size: 50, color: Ex.C.pink, rot: -0.12, t1: T.a - 0.05 });
      Ex.stamp(t, T.days, "1M USERS · 5 DAYS", 560, 560, { font: f.title, size: 40, color: Ex.C.amber, rot: 0.08, t1: T.and + 0.1 });
      this.chatty(t, T);
      this.confetti(t, T.cert, MON.x + MON.w / 2, MON.y + MON.h / 2);
    }, shake);
    // lower third for our developer
    Ex.lowerThird(t, T.dev, T.this - 0.2, { fonts: { tag: f.tag, title: f.title, body: f.bodyR }, tag: "OUR DEVELOPER", title: "makevoid",
      sub: "React + FastAPI + Postgres · Dec 2022", x: 70 * K, y: 70 * K, color: Ex.C.amber });
    Ex.card(t, T.write + 0.2, T.enter + 0.1, 40 * K, 36 * K, 600 * K, { side: "left", fonts: { tag: f.tag, title: f.title, body: f.bodyR, cite: f.bodyR },
      size: 19 * K, title: "Why it could suddenly chat: RLHF",
      body: "InstructGPT: fine-tune on human demos, train a reward model rφ on human rankings, optimise with PPO. Humans preferred the 1.3B model's outputs to 175B GPT-3's, with 100× fewer parameters.",
      cite: "Ouyang et al. 2022 · arXiv:2203.02155" });
    Ex.caption(t, this.ph, { font: f.body, size: 34, speakers: { prof: "#FFFFFF", dev: "#A9C8FF", chat: "#3FD9AE" } });
    Ex.vignette(0.3);
    Ex.wipe(t, 0, { dur: 0.9, color: Ex.C.ink, dir: "right" });
  }
});
