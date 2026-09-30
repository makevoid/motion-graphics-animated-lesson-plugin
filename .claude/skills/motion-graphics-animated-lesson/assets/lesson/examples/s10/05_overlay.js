// s10 end credits (song 190.125–220.125 s, frames 4563–5282 = the end of the video; t is section-local). No speech; music bed =
// prompts/finish-music/music.yml "titles" (ElevenLabs Music v2.5, restarted from its top here), SFX = prompts/finish-sfx/sfx.yml.
// Background: Ex.C.ink.
//
// Join: s09t (prompts/s09t/05_overlay.js, the 3 s VHS rewind bridge: the end card's "git checkout 63bd846" runs and the lesson
// rewinds to its cold open) ends on a warm flash (0.92). Frame 0 here opens on the title card already centred (SCR.off) under
// that flash, which decays in 0.4 s; the ▶ PLAY OSD and scanlines fade out and "first commit 63bd846" gets an amber highlight
// (landing()). Then a film-style credits scroll: title card → STARRING (keyed, looping H3 faces in vignettes, alternating
// sides, zig-zag) → Directed/Produced → crew & technology (two-column block credits) → joke credits → final card that stops
// centred and holds ("Class dismissed." · HEAD → 63bd846) while Davinci peeks in and gets a STOP TOKEN stamp.
// endCardDraw / paradeDraw below are kept verbatim (s09c/s09t mirror them) but no longer drawn here.
//
// Scroll S(t) (world units at 1920×1080): starts at SCR.off, holds SCR.hold, eases in, cruises at a readable VC (solved so the
// final card lands centred at T_STOP), eases out and holds ≥ 2.5 s.
// Faces/runners: output/s10/04_clips (H3 Max 768P, end_image = image, so frame N ≈ frame 0 and they loop over N frames).
const W = 1920, H = 1080;
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
const U0 = 6.0;                                   // end-card clock at s10 frame 0 (s09 card starts at 140/24 s, s09 lasts 284/24 s)
// ---- scroll profile (s): starts at `off` (title card centred, landed from the s09t rewind), holds, eases in, cruises at VC
// (solved), eases out, holds ----
const SCR = { off: 750, hold: 1.4, tIn: 1.2, tStop: 27.2, tOut: 1.5 };
const LAND = { flash: 0.92, tFlash: 0.4, tOsd0: 0.7, tOsd1: 1.2, tScan: 0.6, tHi0: 0.35, tHi1: 2.2 };   // s09t hand-off
// ---- starring faces (clips from gen:clips RUN=s10) ----
const FACE_D = 180, ZP = 100;                     // vignette diameter, zig-zag pitch between consecutive entries
const FACES = [
  { clip: "face_prof", name: "Prof. Otto Regress", voice: "voice · ElevenLabs Eleven v4 · “George”", tag: "(also plays: the stop token)", ring: "#E0A63A", fx: "chalk" },
  { clip: "face_gpt3", name: "GPT-3 “Davinci”", voice: "code-davinci-002 · voice · Eleven v4 · “Callum”", tag: "(still printing…)", ring: "#FFB53D", fx: "paper" },
  { clip: "face_chatty", name: "ChatGPT “Chatty”", voice: "voice · Eleven v4 · “Jessica”", tag: "(sorry for any confusion!)", ring: "#F3EFE4", fx: "bubble" },
  { clip: "face_claude", name: "Claude", voice: "voice · Eleven v4 · “River”", tag: "(can I help?)", ring: "#D97757", fx: "spark" },
  { clip: "face_codex", name: "Codex", voice: "voice · Eleven v4 · “Eric”", tag: "(already done.)", ring: "#5B6CFF", fx: "terminal" },
  { clip: "face_luca", name: "makevoid, the developer", voice: "as themselves (the repo’s author) · voice · Eleven v4 · “Liam”", tag: "(also the producer — see below)", ring: "#9AA4B6", fx: "zz" },
  { clip: "face_py", name: "Py the Python snake", voice: "non-speaking role", tag: "(import this)", ring: "#3776AB", fx: "peek" },
  { clip: "face_reacty", name: "Reacty the React atom", voice: "non-speaking role", tag: "(re-rendering…)", ring: "#61DAFB", fx: "orbit" }
];
// ---- crew & technology (two-column block credits: role over name) ----
const CREW = [
  ["Character design & director of photography", "OpenAI GPT Image 2.5 “Sunburst” · quality xhigh"],
  ["Character animation & lip-sync", "MiniMax H3 Max image-to-video · 1080P (credits faces & parade at 768P)"],
  ["Voices & word timings", "ElevenLabs Eleven v4 text-to-speech"],
  ["Music", "ElevenLabs Music v2.5 — five 60 s beds, looped and ducked under the voice"],
  ["Sound effects (incl. the tadaaa)", "Stable Audio 3 Small (Stability AI)"],
  ["Motion graphics, cameras & typography", "p5.js 2.3 (Processing Foundation), rendered headless with Node + Puppeteer/Chrome"],
  ["Compositing, chroma key & audio mix", "Python (NumPy, Pillow) · FFmpeg (x264/AAC) · ImageMagick"],
  ["Model inference", "fal.ai"],
  ["Pipeline & orchestration", "Ruby + Rake toolkit “motion-graphics-music-video” (Claude Code plugin v0.2.3) with its MCP server"],
  ["Production crew", "8 waves of Claude Code sub-agents (29 jobs)"],
  ["Typefaces", "Chalkduster · SF Mono · Andale Mono · DIN Condensed · DIN Alternate · Roboto · STIX · Bradley Hand"],
  ["Research", "web search — sources on the end card"],
  ["Filmed on location", "Lecture Hall 101, Department of Software Archaeology (fictional)"]
];
const JOKES = [["Catering", "600 tokens, max."], ["Curtain puller", "MiniMax H3 Max (1080P)"], ["Continuity", "GPT-3 “Davinci” (could not stop continuing)"], ["Stop sequences", "Prof. Otto Regress"]];

Anim.sketch({
  async load() {
    this.f = await Anim.fonts({ chalk: "chalk.ttf", mono: "mono.ttf", tag: "din-alt.ttf", title: "din-cond.ttf", body: "body-med.ttf",
      bodyR: "body.ttf", hand: "hand.ttf", monoA: "mono-andale.ttf" });
    const img = (p) => new Promise((ok) => loadImage(p, ok, () => ok(null)));
    // bot parade (same clips and anchoring as s09)
    this.runners = await Promise.all(PARADE.runners.map(async (r) => {
      const meta = await new Promise((ok) => loadJSON(`/output/s10/04_clips/${r.name}.json`, ok, () => ok(null)));
      if (!meta) return { ...r, frames: [] };
      const frames = await Promise.all(Array.from({ length: meta.frames }, (_, i) => img(`/${meta.dir}/${String(i).padStart(4, "0")}.png`)));
      const ok = frames.filter(Boolean);
      return { ...r, frames: ok, ...this.paradeLoad(meta, ok) };
    }));
    // faces: every frame, plus the horizontal centre of the head (alpha centroid of the top 60% of frame 0)
    this.faces = await Promise.all(FACES.map(async (fc) => {
      const c = await Anim.clip(fc.clip), im = c.images[0];
      im.loadPixels();
      const w = im.width, h = im.height, p = im.pixels; let sx = 0, n = 0;
      for (let y = 0; y < h * 0.6; y += 2) for (let x = 0; x < w; x += 2) if (p[(y * w + x) * 4 + 3] > 140) { sx += x; n++; }
      return { ...fc, c, fcx: n ? sx / n : w / 2 };
    }));
    this.layout();
  },

  // ---------------- strip layout (world units; the end card occupies 0..1080, content starts below the parade band) ----------------
  layout() {
    const f = this.f, B = []; let y = 1110;
    const add = (h, fn) => { B.push({ y, h, fn }); y += h; };
    add(370, (Y) => this.titleCard(Y));
    add(20, () => {});
    add(100, (Y) => this.heading("STARRING", Y + 62));
    const st = y; add((FACES.length - 1) * ZP + FACE_D + 20, (Y, t) => this.starring(Y, t));
    this.starTop = st;
    add(30, () => {});
    add(230, (Y) => this.bigCredits(Y));
    add(20, () => {});
    add(100, (Y) => this.heading("CREW & TECHNOLOGY", Y + 62));
    // two-column crew rows (pre-wrapped)
    textFont(f.body); textSize(28);
    for (let i = 0; i < CREW.length; i += 2) {
      const cells = [CREW[i], CREW[i + 1]].filter(Boolean).map(([role, name]) => ({ role, lines: this.wrap(name, 760) }));
      const rh = 34 + Math.max(...cells.map((c) => c.lines.length)) * 38 + 20;
      add(rh, (Y) => this.crewRow(Y, cells));
    }
    add(30, () => {});
    add(JOKES.length * 50 + 110, (Y) => this.jokes(Y));
    add(60, () => {});
    this.finalY = y + 220;                            // centre of the final card on the strip
    add(440, (Y, t) => this.finalCard(Y + 220, t));
    this.blocks = B;
    // solve the cruise speed so the final card stops centred at tStop
    const s = SCR, sFinal = this.finalY - H / 2;
    this.vc = (sFinal - s.off) / (s.tIn / 2 + (s.tStop - s.tOut - s.hold - s.tIn) + s.tOut / 2);
    this.vpts = [[0, 0], [s.hold, 0], [s.hold + s.tIn, this.vc], [s.tStop - s.tOut, this.vc], [s.tStop, 0]];
    console.log(`s10 credits: strip ${Math.round(y)} units, final card centre ${Math.round(this.finalY)}, cruise ${this.vc.toFixed(1)} px/s`);
  },
  scroll(t) {                                         // ∫ piecewise-linear speed
    let S = SCR.off; const P = this.vpts;
    for (let i = 1; i < P.length; i++) {
      const [a, va] = P[i - 1], [b, vb] = P[i];
      if (t <= a) break;
      const e = Math.min(t, b), ve = va + ((vb - va) * (e - a)) / (b - a);
      S += ((va + ve) / 2) * (e - a);
    }
    return S;
  },
  wrap(str, w) {
    const out = []; let line = "";
    for (const word of str.split(" ")) {
      const test = line ? line + " " + word : word;
      if (Ex.tw(test) > w && line) { out.push(line); line = word; } else line = test;
    }
    if (line) out.push(line);
    return out;
  },
  ctext(str, x, y) { return Ex.text(str, x - Ex.tw(str) / 2, y); },
  spaced(str, x, y, sp) {                             // letter-spaced, centred
    const chars = [...str], ws = chars.map((c) => (c === " " ? textSize() * 0.32 : textWidth(c))), tot = ws.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
    let cx = x - tot / 2; chars.forEach((c, i) => { text(c, cx, y); cx += ws[i] + sp; });
    return tot;
  },

  // ---------------- blocks ----------------
  titleCard(Y) {
    const f = this.f; noStroke(); textAlign(LEFT, BASELINE);
    textFont(f.hand); textSize(34); fill(243, 239, 228, 185); this.ctext("a makevoid production", W / 2, Y + 42);
    textFont(f.title); textSize(122); fill(Ex.C.amber);
    drawingContext.shadowColor = "rgba(255,181,61,0.45)"; drawingContext.shadowBlur = 28;
    this.spaced("SOFTWARE ARCHAEOLOGY 101", W / 2, Y + 168, 6);
    drawingContext.shadowBlur = 0;
    Ex.chalk("AI code generation before Claude Code & Codex", W / 2, Y + 236, { font: f.chalk, size: 42, align: CENTER, progress: 99 });
    textFont(f.body); textSize(28); fill(Ex.C.chalk); textAlign(LEFT, BASELINE);
    this.ctext("Based on the repository github.com/makevoid/gpt3_generate_app", W / 2, Y + 304);
    textFont(f.mono); textSize(22); fill(150, 160, 175);
    this.ctext("first commit 63bd846 · 14 Nov 2022   ·   17 commits · 14–29 Nov 2022", W / 2, Y + 346);
  },
  heading(str, yb) {
    const f = this.f; noStroke(); textFont(f.title); textSize(60); fill(Ex.C.amber); textAlign(LEFT, BASELINE);
    const w = this.spaced(str, W / 2, yb, 10);
    fill(255, 181, 61, 120);
    rect(W / 2 - w / 2 - 190, yb - 22, 150, 3); rect(W / 2 + w / 2 + 40, yb - 22, 150, 3);
  },
  bigCredits(Y) {
    const f = this.f; noStroke(); textAlign(LEFT, BASELINE);
    const col = (x, role, name, sub, subCol) => {
      textFont(f.tag); textSize(24); fill(243, 239, 228, 160); this.spaced(role, x, Y + 40, 4);
      textFont(f.title); textSize(96); fill(Ex.C.chalk); this.ctext(name, x, Y + 146);
      textFont(f.body); textSize(27); fill(subCol); this.ctext(sub, x, Y + 196);
    };
    col(560, "DIRECTED, WRITTEN & EDITED BY", "Claude", "Claude Opus 5.5 in Claude Code", Ex.C.claude);
    col(1360, "PRODUCER", "makevoid", "(yes, the developer) · the human in the loop", Ex.C.amber);
    fill(243, 239, 228, 60); rect(W / 2 - 1, Y + 20, 2, 190);
  },
  crewRow(Y, cells) {
    const f = this.f; noStroke();
    cells.forEach((c, i) => {
      const x = i ? 1000 : 160;
      textAlign(LEFT, BASELINE); textFont(f.tag); textSize(22); fill(Ex.C.amber);
      Ex.text(c.role.toUpperCase(), x, Y + 26);
      textFont(f.body); textSize(28); fill(Ex.C.chalk);
      c.lines.forEach((l, k) => Ex.text(l, x, Y + 66 + k * 38));
    });
  },
  jokes(Y) {
    const f = this.f; noStroke();
    JOKES.forEach(([role, name], i) => {
      const yb = Y + 34 + i * 50;
      textFont(f.tag); textSize(24); fill(255, 181, 61, 220); textAlign(RIGHT, BASELINE); text(role.toUpperCase(), W / 2 - 26, yb);
      textFont(f.body); textSize(28); fill(Ex.C.chalk); textAlign(LEFT, BASELINE); Ex.text(name, W / 2 + 26, yb);
    });
    textFont(f.hand); textSize(34); fill(243, 239, 228, 200); textAlign(LEFT, BASELINE);
    this.ctext("No robots were harmed in the making of this lecture.", W / 2, Y + JOKES.length * 50 + 70);
    textSize(24); fill(243, 239, 228, 130);
    this.ctext("(Chatty  apologises  anyway.)", W / 2, Y + JOKES.length * 50 + 104);
  },

  // ---------------- starring: keyed looping faces in vignettes, alternating sides, zig-zag ----------------
  starring(Y, t) {
    this.faces.forEach((fc, i) => {
      const left = i % 2 === 0, cy = Y + i * ZP + FACE_D / 2, cx = left ? 300 : W - 300;
      if (cy < -FACE_D || cy > H + FACE_D) return;
      const pk = Anim.ease.outBack(Anim.clamp01((H + 40 - cy) / 200));      // bounces in as it rises past the bottom
      const fade = Anim.clamp01((H + 10 - cy) / 150);
      this.vignette(fc, cx, cy, FACE_D * pk, t, i);
      // text: name, voice, tag — slides in from the face side
      push(); drawingContext.globalAlpha *= fade; translate((left ? -1 : 1) * 30 * (1 - fade), 0); noStroke();
      const tx = left ? cx + FACE_D / 2 + 40 : cx - FACE_D / 2 - 40;
      textAlign(left ? LEFT : RIGHT, BASELINE);
      textFont(this.f.title); textSize(58); fill(Ex.C.chalk); text(fc.name, tx, cy - 8);
      textFont(this.f.body); textSize(25); fill(Ex.C.amber); text(fc.voice, tx, cy + 30);
      textFont(this.f.hand); textSize(25); fill(243, 239, 228, 150); text(fc.tag, tx, cy + 64);
      pop();
    });
  },
  vignette(fc, cx, cy, D, t, i) {
    if (D < 2) return;
    const n = fc.c.images.length - 1, im = fc.c.images[((Math.floor(t * 24 + i * 11) % n) + n) % n];
    const R = D / 2, fh = im.height, k = D / fh;
    const peek = fc.fx === "peek" ? 0.45 * D * (1 - Anim.ease.outCubic(Anim.clamp01((H - 40 - cy) / 260))) : 0;
    const wob = fc.fx === "paper" ? 0.05 * Math.sin(t * 3.1) : 0;
    push(); translate(cx, cy); rotate(wob);
    // back disc + frame shape
    const shape = () => {
      drawingContext.beginPath();
      if (fc.fx === "terminal") drawingContext.roundRect(-R, -R, D, D, D * 0.16);
      else drawingContext.arc(0, 0, R, 0, Math.PI * 2);
    };
    noStroke(); fill(0, 0, 0, 90); drawingContext.filter = "blur(10px)"; circle(6, 12, D * 1.02); drawingContext.filter = "none";
    if (fc.fx === "bubble") { fill(fc.ring); triangle(-R * 0.72, R * 0.45, -R * 0.3, R * 0.85, -R * 1.02, R * 1.02); }
    const g = drawingContext.createRadialGradient(0, -R * 0.3, R * 0.1, 0, 0, R);
    g.addColorStop(0, "#343B4E"); g.addColorStop(1, "#20242F");
    drawingContext.save(); shape(); drawingContext.fillStyle = g; drawingContext.fill(); drawingContext.clip();
    imageMode(CORNER); image(im, -fc.fcx * k, -0.52 * fh * k + peek, im.width * k, fh * k);
    drawingContext.restore();
    // ring
    noFill(); stroke(fc.ring); strokeWeight(Math.max(1, D * 0.035));
    drawingContext.save(); shape(); drawingContext.stroke(); drawingContext.restore();
    if (fc.fx === "terminal") {                                      // Codex: a terminal title bar with three dots
      noStroke(); fill(fc.ring); rect(-R, -R, D, D * 0.12, D * 0.16, D * 0.16, 0, 0);
      fill(Ex.C.chalk); [0, 1, 2].forEach((j) => circle(-R + D * 0.1 + j * D * 0.07, -R + D * 0.06, D * 0.035));
    }
    if (fc.fx === "paper") {                                         // Davinci: a curl of tractor-feed paper printing out of the frame
      const L = D * (0.35 + 0.1 * Math.sin(t * 2.3));
      noStroke(); fill(Ex.C.paper); stroke(Ex.C.ink); strokeWeight(2);
      beginShape(); vertex(R * 0.55, R * 0.72); vertex(R * 0.55 + L, R * 0.72 + L * 0.35); vertex(R * 0.55 + L - 6, R * 0.72 + L * 0.35 + 26); vertex(R * 0.5, R * 0.72 + 24); endShape(CLOSE);
      noStroke(); fill(Ex.C.ink); for (let q = 12; q < L - 6; q += 14) circle(R * 0.55 + q, R * 0.72 + q * 0.35 + 5, 3);
    }
    if (fc.fx === "spark") {                                         // Claude: twinkling starburst sparks on the ring
      noStroke(); fill(255, 214, 140);
      [[0.72, -0.72, 0], [0.95, -0.2, 1.7], [-0.8, -0.62, 3.1]].forEach(([a, b, ph]) => {
        const s = D * 0.07 * (0.5 + 0.5 * Math.sin(t * 6 + ph));
        push(); translate(a * R, b * R); beginShape();
        for (let q = 0; q < 8; q++) { const r = q % 2 ? s * 0.3 : s; vertex(Math.cos((q * Math.PI) / 4) * r, Math.sin((q * Math.PI) / 4) * r); }
        endShape(CLOSE); pop();
      });
    }
    if (fc.fx === "orbit") {                                         // Reacty: electrons orbiting the frame on tilted paths
      noStroke(); fill(Ex.C.chalk);
      [0, 2.1, 4.2].forEach((ph, j) => {
        const a = t * 2.4 + ph, tilt = j * 1.05;
        const ex = Math.cos(a) * R * 1.12, ey = Math.sin(a) * R * 0.42;
        circle(ex * Math.cos(tilt) - ey * Math.sin(tilt), ex * Math.sin(tilt) + ey * Math.cos(tilt), D * 0.06);
      });
    }
    if (fc.fx === "zz") {                                            // makevoid (the developer): drowsy z's drifting off the frame
      noStroke(); textFont(this.f.hand); textAlign(CENTER, CENTER);
      [0, 0.8].forEach((ph) => {
        const q = ((t * 0.6 + ph) % 1.6) / 1.6; fill(243, 239, 228, 200 * Math.sin(q * Math.PI));
        textSize(D * (0.12 + 0.08 * q)); text("z", R * (0.8 + 0.3 * q), -R * (0.7 + 0.5 * q));
      });
    }
    if (fc.fx === "chalk") {                                         // Prof: a chalk tick mark on the frame
      Ex.chalkLine([[R * 0.62, -R * 0.95], [R * 0.74, -R * 0.83], [R * 0.98, -R * 1.12]], 99, { weight: 4, seed: 9, color: "rgba(243,239,228,0.85)" });
    }
    pop();
  },

  // ---------------- final card + Davinci's last word ----------------
  finalCard(cy, t) {
    const f = this.f, s = SCR;
    Ex.chalk("Class dismissed.", W / 2, cy - 20, { font: f.chalk, size: 118, align: CENTER, progress: 99 });
    Ex.chalkLine([[W / 2 - 330, cy + 12], [W / 2 + 330, cy + 6]], 99, { weight: 5, seed: 17, color: "rgba(243,239,228,0.7)" });
    noStroke(); textFont(f.mono); textSize(44); textAlign(LEFT, BASELINE);
    const head = "HEAD → 63bd846", hw = Ex.tw(head), hx = W / 2 - hw / 2 - 12;
    drawingContext.shadowColor = "rgba(255,181,61,0.55)"; drawingContext.shadowBlur = 18;
    fill(Ex.C.amber); Ex.text(head, hx, cy + 96);
    drawingContext.shadowBlur = 0;
    if (Math.floor((U0 + t) * 2.4) % 2 === 0) rect(hx + hw + 10, cy + 62, 22, 40);
    textFont(f.hand); textSize(26); fill(243, 239, 228, 150); this.ctext("Software Archaeology 101 · Prof. Otto Regress", W / 2, cy + 150);
    // gag after the stop: Davinci pops up bottom-right and starts printing again … STOP TOKEN.
    const tp = t - (s.tStop + 0.25);
    if (tp <= 0) return;
    const gp = this.faces[1], rise = Anim.ease.outBack(Anim.clamp01(tp / 0.4));
    const vx = W - 230, vy = H + 130 - rise * 330;
    const tPrint = 0.45, tStamp = 1.6, str = "to be continued...";
    const nCh = Math.max(0, Math.min(str.length, Math.floor((tp - tPrint) * 20)));
    if (nCh > 0) {                                                   // the printout: a strip leaving Davinci toward screen-left
      textFont(f.monoA); textSize(34); const cw = textWidth("M"), L = nCh * cw + 44, py = vy + 30;
      fill(Ex.C.paper); stroke(Ex.C.ink); strokeWeight(2); rect(vx - 110 - L, py - 28, L + 30, 56, 3);
      noStroke(); fill(Ex.C.ink); for (let x = vx - 110 - L + 8; x < vx - 86; x += 18) { circle(x, py - 20, 4); circle(x, py + 20, 4); }
      fill(40, 36, 48); textAlign(LEFT, CENTER); text(str.slice(0, nCh), vx - 88 - L, py + 1);
      Ex.stamp(tp, tStamp, "STOP TOKEN", vx - 100 - L / 2, py - 4, { font: f.title, size: 66, color: Ex.C.pink, rot: -0.1 });
    }
    this.vignette({ ...gp, fx: "none" }, vx, vy, 200, t, 1);
  },

  draw(t) {
    const K = width / W, S = this.scroll(t), u = U0 + t;
    push(); scale(K);
    background(Ex.C.ink);
    for (const b of this.blocks) {
      const Y = b.y - S;
      if (Y > H + 40 || Y + b.h < -300) continue;
      b.fn(Y, t);
    }
    this.landing(t, this.blocks[0].y - S);
    pop();
  },

  // the s09t VHS rewind lands here: highlight "first commit 63bd846", fading scanlines + ▶ PLAY OSD, decaying warm flash
  landing(t, Y) {
    const L = LAND, f = this.f;
    const h = Anim.clamp01((t - L.tHi0) / 0.35) * (1 - Anim.clamp01((t - L.tHi1) / 0.6));
    if (h > 0) {
      textFont(f.mono); textSize(22);
      const str = "first commit 63bd846", w = Ex.tw(str), full = Ex.tw("first commit 63bd846 · 14 Nov 2022   ·   17 commits · 14–29 Nov 2022");
      const x0 = W / 2 - full / 2, grow = Anim.ease.outCubic(Anim.clamp01((t - L.tHi0) / 0.5));
      noStroke(); fill(255, 181, 61, 70 * h); rect(x0 - 8, Y + 322, (w + 16) * grow, 34, 6);
      fill(255, 181, 61, 255 * h); rect(x0, Y + 358, w * grow, 3);
    }
    const sc = 1 - Anim.clamp01(t / L.tScan);
    if (sc > 0) { noStroke(); fill(0, 40 * sc); for (let y = 0; y < H; y += 4) rect(0, y, W, 2); }
    const oa = 1 - Anim.clamp01((t - L.tOsd0) / (L.tOsd1 - L.tOsd0));
    if (oa > 0) {
      push(); noStroke(); textFont(f.mono); textSize(58); textAlign(LEFT, BASELINE);
      drawingContext.shadowColor = `rgba(0,0,0,${0.85 * oa})`; drawingContext.shadowOffsetX = 4; drawingContext.shadowOffsetY = 4;
      fill(236, 248, 240, 255 * oa); text("▶ PLAY", 96, 128); textAlign(RIGHT, BASELINE); text("SP", W - 96, 128);
      pop();
    }
    const fa = L.flash * (1 - Anim.ease.outCubic(Anim.clamp01(t / L.tFlash)));
    if (fa > 0) { noStroke(); fill(255, 244, 225, 255 * fa); rect(0, 0, W, H); }
  },

  // ---------------- end card + bot parade (verbatim copy of prompts/s09/05_overlay.js; s10 calls them with dy = -S, u = 6 + t) ----------------
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
