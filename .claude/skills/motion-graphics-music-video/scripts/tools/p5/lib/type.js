// Anim type: typewriter reveals, knockout (outlined) text, word stacks and karaoke captions.
window.Anim = window.Anim || {};

(() => {
  const { clamp01 } = Anim;

  // Text with a thick outline drawn *under* the fill (a sticker / riso knockout that reads on busy plates).
  // ghost: { color, dx, dy } adds a misregistered second ink between the outline and the fill.
  Anim.knockout = (str, x, y, { fill: f = "#e8488f", outline = "#f1ead9", weight = 0, ghost = null } = {}) => {
    push();
    if (weight > 0) {
      stroke(outline);
      strokeWeight(weight);
      strokeJoin(ROUND);
      fill(outline);
      text(str, x, y);
    }
    noStroke();
    if (ghost) {
      fill(ghost.color);
      text(str, x + (ghost.dx ?? 5), y + (ghost.dy ?? 4));
    }
    fill(f);
    text(str, x, y);
    pop();
  };

  // Characters of `str` visible at progress 0..1 (typewriter).
  Anim.typed = (str, progress) => str.slice(0, Math.round(str.length * clamp01(progress)));

  // Typewriter synced to sung words: `parts` = [{ text: "in ", cue: {s, e} }, ...]; each part types
  // across its cue's duration (min `minDur`), so the text lands with the vocal. Returns the visible string.
  Anim.typedWords = (t, parts, { minDur = 0.12 } = {}) =>
    parts.map(({ text: str, cue }) => Anim.typed(str, (t - cue.s) / Math.max(minDur, cue.e - cue.s))).join("");

  // Karaoke caption: words laid out left to right from (x, y) (baseline). Words before the active one
  // are `done`, the active word is `active` with an underline growing over its duration, later words `todo`.
  // activeFont / activeWeight (variable fonts, p5 2.x textWeight) make the sung word heavier.
  Anim.karaoke = (t, words, x, y, { font, size, activeFont, weight, activeWeight, done = "#2b3a7a", todo = "rgba(43,58,122,0.45)",
    active = "#2b3a7a", underline = "#e8488f", gap = 0.28 } = {}) => {
    push();
    textSize(size);
    textAlign(LEFT, BASELINE);
    let cx = x;
    for (const { text: str, cue } of words) {
      const isActive = t >= cue.s && t < cue.e + 0.15;
      const isDone = t >= cue.e + 0.15;
      textFont(isActive && activeFont ? activeFont : font);
      if (weight || activeWeight) textWeight(isActive && activeWeight ? activeWeight : weight || 400);
      noStroke();
      fill(isActive ? active : isDone ? done : todo);
      text(str, cx, y);
      const w = textWidth(str);
      if (isActive || isDone) {
        const p = isDone ? 1 : clamp01((t - cue.s) / Math.max(0.15, cue.e - cue.s));
        stroke(underline);
        strokeWeight(size * 0.09);
        strokeCap(ROUND);
        line(cx, y + size * 0.2, cx + w * Anim.ease.outCubic(p), y + size * 0.2);
      }
      cx += w + size * gap;
    }
    pop();
    return cx - x;
  };

  // Width of a caption laid out by Anim.karaoke (to size its paper slip).
  Anim.karaokeWidth = (words, { font, size, weight, gap = 0.28 }) => {
    push();
    textFont(font);
    textSize(size);
    if (weight) textWeight(weight);
    const w = words.reduce((sum, { text: str }) => sum + textWidth(str) + size * gap, 0) - size * gap;
    pop();
    return w;
  };
})();
