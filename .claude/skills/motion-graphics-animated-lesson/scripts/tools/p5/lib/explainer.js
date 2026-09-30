// Ex: explainer-video toolkit on top of Anim (core/time/fx/type). Everything is a pure function of t (seconds), so any frame
// renders alone. Colours come from the approved style bible (Ex.C); fonts are loaded by the sketch and passed in.
//
//   Ex.cam(t, keys) / Ex.withCam(cam, fn)     keyframed camera (x, y = focus point, z = zoom, r = roll)
//   Ex.puppet(img, t, {...})                  a still sprite performing: enter/exit, idle bob + breathe, talk bounce, tilt
//   Ex.talk(words, speaker, t)                0..1 "is speaking" envelope from words.json (for still sprites / glow)
//   Ex.code(lines, x, y, {...})               syntax-coloured code in a window, typed by progress, with highlight/cursor
//   Ex.window(x, y, w, h, {...})              app window chrome (terminal, editor, chat, browser)
//   Ex.chalk / Ex.chalkLine / Ex.arrow        chalk write-on text, hand-drawn strokes and arrows
//   Ex.card(t, t0, t1, x, y, w, {...})        "PhD NOTE" overlay card (tag, title, body, citation), slides in and out
//   Ex.stamp(t, t0, str, x, y, {...})         rubber-stamp slam
//   Ex.caption(t, words, {...})               phrase subtitles from word timings, active word highlighted
//   Ex.gitlog(t, commits, x, y, w, {...})     commit timeline ribbon with the active commit glowing
//   Ex.bubble(x, y, w, h, {...})              chat bubble;  Ex.burst(t, t0, x, y, {...}) particle burst;  Ex.wipe(...) transition
//   Ex.wrap(str, w) / Ex.roll(t, t0, dur, a, b) / Ex.vignette(a) / Ex.grid(...) utilities
window.Ex = window.Ex || {};

(() => {
  const { clamp01, ease, progress, tween } = Anim;

  Ex.C = {
    ink: "#1B1A22", board: "#1E3B34", boardDark: "#142A24", chalk: "#F3EFE4", chalkDim: "rgba(243,239,228,0.55)",
    paper: "#F6EEDC", amber: "#FFB53D", claude: "#D97757", chat: "#10A37F", react: "#61DAFB", pyBlue: "#3776AB",
    pyYellow: "#FFD43B", pg: "#336791", ruby: "#CC342D", phd: "#8B6CFF", pink: "#FF5C8A", night: "#101522", slate: "#2A3142",
    codeBg: "#161A24", codeFg: "#E6E1CF", codeKw: "#FF8F40", codeStr: "#B8CC52", codeNum: "#E6B673", codeCom: "#6C7A89",
    codeFn: "#59C2FF", codeConst: "#D2A6FF"
  };

  // ---------- camera ----------
  // keys: [{ t, x, y, z = 1, r = 0, ease = "inOutCubic" }] sorted by t; before/after the ends it holds.
  Ex.cam = (t, keys) => {
    if (t <= keys[0].t) return { z: 1, r: 0, ...keys[0] };
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t < b.t) {
        const e = ease[b.ease || "inOutCubic"](clamp01((t - a.t) / (b.t - a.t)));
        const L = (p, d) => (a[p] ?? d) + ((b[p] ?? d) - (a[p] ?? d)) * e;
        return { x: L("x", width / 2), y: L("y", height / 2), z: L("z", 1), r: L("r", 0) };
      }
    }
    return { z: 1, r: 0, ...keys[keys.length - 1] };
  };
  // Draw fn in world space seen through cam (focus point x, y at screen centre); shake: [dx, dy] added in screen space.
  Ex.withCam = (cam, fn, shake = [0, 0]) => {
    push();
    translate(width / 2 + shake[0], height / 2 + shake[1]);
    if (cam.r) rotate(cam.r);
    scale(cam.z);
    translate(-cam.x, -cam.y);
    fn();
    pop();
  };

  // ---------- sprites ----------
  // Image drawn centred at x, y with height h (keeps aspect). flip mirrors horizontally.
  Ex.img = (img, x, y, h, { alpha = 1, rot = 0, flip = false, sx = 1, sy = 1, anchor = "center" } = {}) => {
    if (!img || alpha <= 0) return;
    const w = (h * img.width) / img.height;
    push();
    translate(x, y);
    if (rot) rotate(rot);
    scale(flip ? -sx : sx, sy);
    const prev = drawingContext.globalAlpha;
    drawingContext.globalAlpha = prev * alpha;
    imageMode(CORNER);
    image(img, -w / 2, anchor === "bottom" ? -h : -h / 2, w, h);
    drawingContext.globalAlpha = prev;
    pop();
  };

  // 0..1 speaking envelope for `speaker` from words.json entries {w, s, e, speaker}: rises on each word, dips between.
  Ex.talk = (words, speaker, t) => {
    let v = 0;
    for (const w of words) {
      if (speaker && w.speaker !== speaker) continue;
      if (t >= w.s - 0.05 && t <= w.e + 0.08) {
        const mid = (w.s + w.e) / 2, half = Math.max(0.06, (w.e - w.s) / 2);
        v = Math.max(v, 1 - Math.min(1, Math.abs(t - mid) / (half + 0.08)) * 0.6);
      }
    }
    return v;
  };

  // A still sprite that performs. o: { x, y, h, t0 (enter), t1 (exit), from: "pop"|"left"|"right"|"bottom"|"top"|"drop",
  //   bob: px, speed, breathe: 0..0.05, talk: 0..1 (from Ex.talk), tilt: rad, flip, alpha, anchor: "bottom" (feet on y) }
  Ex.puppet = (img, t, o) => {
    const { x, y, h, t0 = -1, t1 = Infinity, from = "pop", bob = 6, speed = 1.3, breathe = 0.018, talk = 0, tilt = 0,
      flip = false, alpha = 1, phase = 0, anchor = "bottom", enterDur = 0.45, exitDur = 0.35 } = o;
    if (t < t0 || t > t1 + exitDur) return;
    let dx = 0, dy = 0, s = 1, a = alpha;
    const pin = clamp01((t - t0) / enterDur);
    if (pin < 1) {
      if (from === "pop") s = ease.outBack(pin);
      else if (from === "drop") dy = -height * (1 - ease.outBack(pin));
      else if (from === "left") dx = -width * 0.7 * (1 - ease.outCubic(pin));
      else if (from === "right") dx = width * 0.7 * (1 - ease.outCubic(pin));
      else if (from === "bottom") dy = height * 0.6 * (1 - ease.outBack(pin));
      else if (from === "top") dy = -height * 0.6 * (1 - ease.outCubic(pin));
      else if (from === "fade") a *= pin;
    }
    if (t > t1) {
      const pout = clamp01((t - t1) / exitDur);
      s *= 1 - ease.inCubic(pout) * 0.9; a *= 1 - pout;
    }
    const w = Math.sin((t + phase) * speed * TWO_PI);
    const talkSquash = talk * 0.035 * Math.abs(Math.sin(t * 22 + phase));
    const sy = s * (1 + breathe * w + talkSquash), sx = s * (1 - breathe * 0.6 * w - talkSquash * 0.5);
    Ex.img(img, x + dx, y + dy - bob * (0.5 + 0.5 * w) - talk * 6, h, { alpha: a, rot: tilt + talk * 0.03 * Math.sin(t * 9 + phase), flip, sx, sy, anchor });
  };

  // ---------- text utils ----------
  // textWidth that counts spaces (p5 + opentype fonts measure " " as 0 wide).
  Ex.space = () => {
    const cf = textFont();
    if (cf && cf.font && cf.font.charToGlyph) return Math.max((cf.font.charToGlyph(" ").advanceWidth / cf.font.unitsPerEm) * textSize(), textSize() * 0.3);
    return textWidth("i i") - textWidth("ii");
  };
  Ex.tw = (str) => { const sp = Ex.space(); return String(str).split(" ").reduce((w, part, i) => w + textWidth(part) + (i ? sp : 0), 0); };
  // Text drawn word by word so spaces keep their width (use instead of text() for strings with spaces in loaded fonts).
  Ex.text = (str, x, y) => { const sp = Ex.space(); let cx = x; String(str).split(" ").forEach((part) => { text(part, cx, y); cx += textWidth(part) + sp; }); return cx - x; };
  // Inline math: "P(x) = ∏_{t} p(x_{t} | x_{<t})" with _{sub} and ^{sup}; o: { font, size, color, align: LEFT|CENTER }.
  Ex.math = (src, x, y, { font, size = 48, color = Ex.C.chalk, align = LEFT, alpha = 1 } = {}) => {
    const parts = []; const re = /([_^])\{([^}]*)\}|([^_^]+|[_^])/g; let m;
    while ((m = re.exec(src))) parts.push(m[1] ? { t: m[2], k: m[1] } : { t: m[3], k: "" });
    push(); textFont(font); noStroke(); fill(color); textAlign(LEFT, BASELINE); drawingContext.globalAlpha *= alpha;
    const measure = (p) => { textSize(p.k ? size * 0.62 : size); return Ex.tw(p.t); };
    const W = parts.reduce((w, p) => w + measure(p), 0);
    let cx = align === CENTER ? x - W / 2 : x;
    for (const p of parts) {
      textSize(p.k ? size * 0.62 : size);
      const dy = p.k === "_" ? size * 0.22 : p.k === "^" ? -size * 0.42 : 0;
      if (p.k) cx -= size * 0.1; // tuck scripts against their base
      cx += Ex.text(p.t, cx, y + dy);
    }
    pop();
    return W;
  };
  Ex.wrap = (str, w) => {
    const out = [];
    for (const para of String(str).split("\n")) {
      let line = "";
      for (const word of para.split(" ")) {
        const test = line ? line + " " + word : word;
        if (Ex.tw(test) > w && line) { out.push(line); line = word; } else line = test;
      }
      out.push(line);
    }
    return out;
  };
  Ex.roll = (t, t0, dur, a, b, fmt = (v) => Math.round(v).toLocaleString("en-US")) => fmt(tween(t, t0, dur, a, b, ease.outExpo));

  // ---------- code ----------
  const KW = new Set(("def end class module do if else elsif unless return require require_relative include attr_reader self new " +
    "import from as async await const let var function return export default for in of while try except raise with lambda " +
    "SELECT FROM WHERE INSERT INTO VALUES CREATE TABLE PRIMARY KEY null None True False true false nil puts print yield").split(" "));
  const tokenRe = /(#[^\n]*|\/\/[^\n]*|"[^"]*"?|'[^']*'?|`[^`]*`?|\b\d+(?:\.\d+)?\b|:[a-z_]+\b|@\w+|\b[A-Z][A-Z0-9_]{2,}\b|\b[A-Z]\w*\b|\b\w+(?=\()|\b\w+\b|\s+|.)/g;
  const colorFor = (tok, lang) => {
    const C = Ex.C;
    if (/^(#|\/\/)/.test(tok) && lang !== "md") return C.codeCom;
    if (lang === "md" && /^#/.test(tok)) return C.amber;
    if (/^["'`]/.test(tok)) return C.codeStr;
    if (/^\d/.test(tok)) return C.codeNum;
    if (/^[:@]/.test(tok)) return C.codeConst;
    if (KW.has(tok)) return C.codeKw;
    if (/^[A-Z][A-Z0-9_]{2,}$/.test(tok)) return C.codeConst;
    if (/^[A-Z]/.test(tok)) return C.codeFn;
    return C.codeFg;
  };
  // lines: array of strings. o: { font, size, lang: "rb"|"py"|"js"|"sql"|"md", progress 0..1 (typed chars), lineH,
  //   highlight: [line indices] (amber band), dim: 0..1 non-highlighted dimming, cursor: bool, maxLines }
  // Returns { w, h } of the text block.
  Ex.code = (lines, x, y, o = {}) => {
    const { font, size = 26, lang = "rb", progress: p = 1, lineH = 1.45, highlight = [], dim = 0, cursor = true, gutter = true } = o;
    push();
    textFont(font); textSize(size); textAlign(LEFT, TOP);
    const total = lines.reduce((n, l) => n + l.length + 1, 0);
    let budget = Math.round(total * clamp01(p));
    const adv = (s) => (typeof fontWidth === "function" ? fontWidth(s) : textWidth(s));  // p5 2.x: textWidth is the tight ink box
    const cw = adv("M"), lh = size * lineH, gx = gutter ? cw * 3.2 : 0;
    let lastX = x + gx, lastY = y, maxW = 0;
    lines.forEach((line, i) => {
      const ly = y + i * lh;
      if (highlight.includes(i)) { noStroke(); fill("rgba(255,181,61,0.16)"); rect(x - 10, ly - lh * 0.12, 2000, lh, 4); fill(Ex.C.amber); rect(x - 10, ly - lh * 0.12, 4, lh); }
      if (budget <= 0 && i > 0) return;
      const faded = dim > 0 && highlight.length && !highlight.includes(i);
      if (gutter) { fill(faded ? "rgba(108,122,137,0.35)" : Ex.C.codeCom); noStroke(); text(String(i + 1).padStart(2, " "), x, ly); }
      const shown = line.slice(0, Math.max(0, budget));
      budget -= line.length + 1;
      let cx = x + gx;
      for (const tok of shown.match(tokenRe) || []) {
        if (/^\s+$/.test(tok)) { cx += cw * tok.length; continue; }
        fill(colorFor(tok, lang)); if (faded) drawingContext.globalAlpha = 1 - dim * 0.7;
        // advance widths, not ink boxes: textWidth(":") is ~0, which collapsed ". : (" and spaces between tokens
        text(tok, cx, ly); cx += adv(tok); drawingContext.globalAlpha = 1;
      }
      maxW = Math.max(maxW, cx - x);
      lastX = cx; lastY = ly;
    });
    // solid while typing, blinking once the block is complete
    if (cursor && p > 0 && (p < 1 || Math.floor((ANIM.t || 0) * 2.5) % 2 === 0)) {
      noStroke(); fill(Ex.C.amber); rect(lastX + 2, lastY + size * 0.05, cw * 0.6, size * 1.05);
    }
    pop();
    return { w: maxW, h: lines.length * lh };
  };

  // App window chrome. theme: "terminal" | "editor" | "chat" | "browser" | "paper". Returns the content origin {x, y}.
  Ex.window = (x, y, w, h, { title = "", theme = "terminal", font, alpha = 1, shadow = true, radius = 16 } = {}) => {
    const T = { terminal: [Ex.C.codeBg, "#232838", "#9AA4B8"], editor: ["#1B1F2B", "#252A38", "#9AA4B8"],
      chat: ["#F7F7F8", "#ECECF1", "#5D5D6B"], browser: ["#FFFFFF", "#E9EAEE", "#5D5D6B"], paper: [Ex.C.paper, "#E9DDC2", "#6B5B45"] }[theme];
    push();
    drawingContext.globalAlpha *= alpha;
    if (shadow) { drawingContext.shadowColor = "rgba(0,0,0,0.35)"; drawingContext.shadowBlur = 40; drawingContext.shadowOffsetY = 16; }
    noStroke(); fill(T[0]); rect(x, y, w, h, radius);
    drawingContext.shadowColor = "transparent";
    fill(T[1]); rect(x, y, w, 44, radius, radius, 0, 0);
    ["#FF5F57", "#FEBC2E", "#28C840"].forEach((c, i) => { fill(c); circle(x + 26 + i * 24, y + 22, 13); });
    if (title && font) { fill(T[2]); textFont(font); textSize(18); textAlign(CENTER, CENTER); text(title, x + w / 2, y + 22); }
    pop();
    return { x: x + 24, y: y + 64 };
  };

  // ---------- chalk ----------
  // Chalk write-on: characters appear over progress with a slight dusty double-stroke.
  Ex.chalk = (str, x, y, { font, size = 48, progress: p = 1, color = Ex.C.chalk, align = LEFT, alpha = 1, seed = 3 } = {}) => {
    const s = Anim.typed(str, p);
    if (!s) return;
    push();
    textFont(font); textSize(size); textAlign(align, BASELINE); noStroke();
    const r = Anim.rng(seed);
    drawingContext.globalAlpha *= alpha;
    fill(color); drawingContext.globalAlpha *= 0.35; text(s, x + (r() - 0.5) * 2.5, y + (r() - 0.5) * 2.5);
    drawingContext.globalAlpha /= 0.35; text(s, x, y);
    pop();
  };
  // Hand-drawn polyline revealed by progress; jitter makes it chalky. arrow: head at the end.
  Ex.chalkLine = (pts, p, { color = Ex.C.chalk, weight = 5, jitter = 1.6, seed = 1, arrow = false, head = 22 } = {}) => {
    p = clamp01(p); if (p <= 0 || pts.length < 2) return;
    const segs = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const d = dist(...pts[i - 1], ...pts[i]); segs.push(d); L += d; }
    let left = L * p; const r = Anim.rng(seed);
    push(); stroke(color); strokeWeight(weight); strokeCap(ROUND); noFill();
    beginShape(); vertex(...pts[0]);
    let end = pts[0], dir = [1, 0];
    for (let i = 1; i < pts.length && left > 0; i++) {
      const k = Math.min(1, left / segs[i - 1]); left -= segs[i - 1];
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const steps = Math.max(2, Math.ceil((segs[i - 1] * k) / 14));
      for (let j = 1; j <= steps; j++) {
        const u = (j / steps) * k;
        vertex(ax + (bx - ax) * u + (r() - 0.5) * jitter, ay + (by - ay) * u + (r() - 0.5) * jitter);
      }
      end = [ax + (bx - ax) * k, ay + (by - ay) * k]; dir = [bx - ax, by - ay];
    }
    endShape();
    if (arrow && p > 0.85) {
      const a = Math.atan2(dir[1], dir[0]), hs = head * clamp01((p - 0.85) / 0.15);
      line(end[0], end[1], end[0] - hs * Math.cos(a - 0.45), end[1] - hs * Math.sin(a - 0.45));
      line(end[0], end[1], end[0] - hs * Math.cos(a + 0.45), end[1] - hs * Math.sin(a + 0.45));
    }
    pop();
  };
  // Curved arrow from (x1,y1) to (x2,y2); bend = perpendicular offset of the midpoint (px).
  Ex.arrow = (x1, y1, x2, y2, p, { bend = 0, ...o } = {}) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, len = dist(x1, y1, x2, y2) || 1;
    const nx = -(y2 - y1) / len, ny = (x2 - x1) / len, cx = mx + nx * bend, cy = my + ny * bend;
    const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([(1 - u) ** 2 * x1 + 2 * (1 - u) * u * cx + u * u * x2, (1 - u) ** 2 * y1 + 2 * (1 - u) * u * cy + u * u * y2]); }
    Ex.chalkLine(pts, p, { arrow: true, jitter: 0.8, ...o });
  };

  // ---------- overlays ----------
  // PhD-level info card. o: { fonts: {tag, title, body, cite}, tag = "PhD NOTE", title, body, cite, color, side: "right"|"left", size }
  Ex.card = (t, t0, t1, x, y, w, o) => {
    if (t < t0 || t > t1 + 0.4) return;
    const { fonts, tag = "PhD NOTE", title = "", body = "", cite = "", color = Ex.C.phd, size = 22, side = "right", bg = "rgba(16,21,34,0.92)" } = o;
    const pin = ease.outCubic(clamp01((t - t0) / 0.4)), pout = ease.inCubic(clamp01((t - t1) / 0.35));
    const off = (side === "right" ? 1 : -1) * (1 - pin + pout) * (w + 80);
    push();
    translate(x + off, y);
    textFont(fonts.body); textSize(size);
    const lines = Ex.wrap(body, w - 48);
    textFont(fonts.title); textSize(size * 1.25);
    const tl = title ? Ex.wrap(title, w - 48) : [];
    const h = 64 + tl.length * size * 1.45 + lines.length * size * 1.38 + (cite ? size * 1.9 : 0) + 18;
    drawingContext.shadowColor = "rgba(0,0,0,0.45)"; drawingContext.shadowBlur = 30; drawingContext.shadowOffsetY = 10;
    noStroke(); fill(bg); rect(0, 0, w, h, 14);
    drawingContext.shadowColor = "transparent";
    fill(color); rect(0, 0, 8, h, 14, 0, 0, 14);
    textFont(fonts.tag); textSize(size * 0.95); textAlign(LEFT, TOP);
    const tw = Ex.tw(tag) + 24; fill(color); rect(24, 18, tw, size * 1.35, 6);
    fill("#FFFFFF"); Ex.text(tag, 36, 18 + size * 0.22);
    let cy = 30 + size * 1.6;
    fill("#FFFFFF"); textFont(fonts.title); textSize(size * 1.25);
    tl.forEach((l) => { Ex.text(l, 24, cy); cy += size * 1.45; });
    fill("rgba(236,232,222,0.92)"); textFont(fonts.body); textSize(size);
    lines.forEach((l) => { Ex.text(l, 24, cy); cy += size * 1.38; });
    if (cite) { fill("rgba(236,232,222,0.5)"); textSize(size * 0.78); Ex.text(cite, 24, cy + size * 0.5); }
    pop();
  };

  // Rubber stamp that slams in at t0 (scale 2.2 -> 1, slight rotation), with a rough double border.
  Ex.stamp = (t, t0, str, x, y, { font, size = 72, color = Ex.C.pink, rot = -0.12, t1 = Infinity, alpha = 0.95 } = {}) => {
    if (t < t0 || t > t1) return;
    const p = clamp01((t - t0) / 0.14), s = 2.2 - 1.2 * ease.outCubic(p);
    push(); translate(x, y); rotate(rot); scale(s);
    drawingContext.globalAlpha *= alpha * Math.min(1, p * 3);
    textFont(font); textSize(size); textAlign(CENTER, CENTER);
    const w = textWidth(str) + size * 0.8, h = size * 1.35;
    noFill(); stroke(color); strokeWeight(size * 0.09); rect(-w / 2, -h / 2, w, h, 8);
    strokeWeight(size * 0.03); rect(-w / 2 + 9, -h / 2 + 9, w - 18, h - 18, 5);
    noStroke(); fill(color); text(str, 0, size * 0.06);
    pop();
  };

  // Subtitles: groups words.json into phrases (break on a pause > gap, punctuation, or maxWords), shows the phrase around t.
  Ex.phrases = (words, { gap = 0.45, maxWords = 9 } = {}) => {
    const out = []; let cur = [];
    words.forEach((w, i) => {
      cur.push(w);
      const next = words[i + 1];
      if (!next || next.s - w.e > gap || /[.!?;:]$/.test(w.w) || cur.length >= maxWords || next.line !== w.line) { out.push(cur); cur = []; }
    });
    return out.map((ws) => ({ words: ws, s: ws[0].s, e: ws[ws.length - 1].e }));
  };
  Ex.caption = (t, phrases, { font, size = 34, y = height - 70, color = "#FFFFFF", active = Ex.C.amber, bg = "rgba(10,12,20,0.62)", speakers = {} } = {}) => {
    const ph = phrases.find((p) => t >= p.s - 0.08 && t <= p.e + 0.35);
    if (!ph) return;
    push(); textFont(font); textSize(size); textAlign(LEFT, BASELINE);
    const str = ph.words.map((w) => w.w).join(" "), tw = Ex.tw(str), sp = Ex.space();
    noStroke(); fill(bg); rect(width / 2 - tw / 2 - 22, y - size * 1.05, tw + 44, size * 1.5, 10);
    let x = width / 2 - tw / 2;
    ph.words.forEach((w) => {
      fill(t >= w.s && t <= w.e + 0.05 ? active : speakers[w.speaker] || color);
      text(w.w, x, y); x += textWidth(w.w) + sp;
    });
    pop();
  };

  // Commit timeline: commits [{hash, date, msg}], drawn left→right across w; active index glows; reveal 0..1 draws the line.
  Ex.gitlog = (t, commits, x, y, w, { fonts, active = -1, reveal = 1, color = Ex.C.amber, dimColor = "rgba(243,239,228,0.4)", labels = true, size = 18 } = {}) => {
    const n = commits.length, step = n > 1 ? w / (n - 1) : 0;
    push();
    stroke(dimColor); strokeWeight(4); line(x, y, x + w * clamp01(reveal), y);
    commits.forEach((c, i) => {
      const cx = x + i * step;
      if (cx > x + w * clamp01(reveal) + 1) return;
      const on = i === active, pulse = on ? 1 + 0.12 * Math.sin(t * 8) : 1;
      noStroke();
      if (on) { fill("rgba(255,181,61,0.25)"); circle(cx, y, 46 * pulse); }
      fill(on ? color : i < active ? Ex.C.chalk : dimColor); circle(cx, y, (on ? 24 : 14) * pulse);
      if (labels && fonts) {
        textAlign(CENTER, TOP); textFont(fonts.mono); textSize(size * 0.85);
        fill(on ? color : dimColor); text(c.hash, cx, y + 22);
        if (on) { textFont(fonts.body); textSize(size); fill(Ex.C.chalk); text(c.msg, cx, y + 22 + size * 1.2); textSize(size * 0.8); fill(dimColor); text(c.date, cx, y - 44); }
      }
    });
    pop();
  };

  // Chat bubble with a tail. tail: "left" | "right" | "none".
  Ex.bubble = (x, y, w, h, { fill: f = "#FFFFFF", stroke: s = null, tail = "left", r = 22 } = {}) => {
    push(); noStroke(); if (s) { stroke(s); strokeWeight(3); } fill(f);
    rect(x, y, w, h, r);
    if (tail === "left") triangle(x + 26, y + h - 2, x + 60, y + h - 2, x + 10, y + h + 26);
    if (tail === "right") triangle(x + w - 26, y + h - 2, x + w - 60, y + h - 2, x + w - 10, y + h + 26);
    pop();
  };

  // Particle burst (seeded): n dots/strokes flying out from x, y after t0 over dur.
  Ex.burst = (t, t0, x, y, { n = 18, color = Ex.C.amber, dur = 0.6, dist: d = 180, size = 10, seed = 5, shape = "dot" } = {}) => {
    const p = (t - t0) / dur; if (p < 0 || p > 1) return;
    const r = Anim.rng(seed), e = ease.outCubic(p);
    push(); noStroke(); fill(color); stroke(color); strokeCap(ROUND);
    for (let i = 0; i < n; i++) {
      const a = r() * TWO_PI, k = 0.5 + r() * 0.8, px = x + Math.cos(a) * d * k * e, py = y + Math.sin(a) * d * k * e;
      drawingContext.globalAlpha = 1 - p;
      if (shape === "dot") { noStroke(); circle(px, py, size * (1 - p * 0.6)); }
      else { strokeWeight(size * 0.4); line(px, py, px - Math.cos(a) * size * 2, py - Math.sin(a) * size * 2); }
    }
    pop();
  };

  // Full-frame wipe transition centred on t0: covers during [t0 - dur/2, t0], uncovers after. dir: "right"|"down"|"iris".
  Ex.wipe = (t, t0, { dur = 0.5, color = Ex.C.ink, dir = "right", x = width / 2, y = height / 2 } = {}) => {
    const p = (t - (t0 - dur / 2)) / dur; if (p <= 0 || p >= 1) return;
    push(); noStroke(); fill(color);
    if (dir === "iris") { const R = Math.hypot(width, height); const k = p < 0.5 ? ease.inCubic(p * 2) : 1 - ease.outCubic((p - 0.5) * 2); circle(x, y, R * 2 * k); }
    else if (dir === "down") { p < 0.5 ? rect(0, 0, width, height * ease.inOutCubic(p * 2)) : rect(0, height * ease.inOutCubic((p - 0.5) * 2), width, height); }
    else { p < 0.5 ? rect(0, 0, width * ease.inOutCubic(p * 2), height) : rect(width * ease.inOutCubic((p - 0.5) * 2), 0, width, height); }
    pop();
  };

  Ex.vignette = (a = 0.45) => {
    const g = drawingContext.createRadialGradient(width / 2, height / 2, height * 0.35, width / 2, height / 2, height * 0.95);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${a})`);
    push(); drawingContext.fillStyle = g; noStroke(); rect(0, 0, width, height); pop();
  };

  // Chalkboard / blueprint grid background in world space.
  Ex.grid = (x0, y0, w, h, { step = 60, color = "rgba(243,239,228,0.06)", weight = 1 } = {}) => {
    push(); stroke(color); strokeWeight(weight);
    for (let x = x0; x <= x0 + w; x += step) line(x, y0, x, y0 + h);
    for (let y = y0; y <= y0 + h; y += step) line(x0, y, x0 + w, y);
    pop();
  };

  // Lower-third title: tag chip + big title + subtitle, slides in at t0 and out at t1.
  Ex.lowerThird = (t, t0, t1, { fonts, tag, title, sub, x = 90, y = height - 230, color = Ex.C.amber }) => {
    if (t < t0 || t > t1 + 0.4) return;
    const p = ease.outCubic(clamp01((t - t0) / 0.45)) - ease.inCubic(clamp01((t - t1) / 0.35));
    push(); translate(x - (1 - p) * 60, y); drawingContext.globalAlpha *= clamp01(p);
    noStroke(); textAlign(LEFT, TOP);
    if (tag) { textFont(fonts.tag); textSize(24); const tw = textWidth(tag) + 26; fill(color); rect(0, 0, tw, 36, 5); fill(Ex.C.ink); text(tag, 13, 6); }
    textFont(fonts.title); textSize(72); fill(Ex.C.chalk); text(title, 0, 48);
    if (sub) { textFont(fonts.body); textSize(28); fill("rgba(243,239,228,0.75)"); text(sub, 2, 128); }
    pop();
  };
})();
