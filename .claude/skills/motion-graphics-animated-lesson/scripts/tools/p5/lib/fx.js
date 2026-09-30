// Anim fx: entrance transforms (slap, pop, slam), shake, sparkle bursts and circuit traces.
// Entrance helpers return { scale, rot, alpha } to pass straight into Anim.at().
window.Anim = window.Anim || {};

(() => {
  const { ease, clamp01 } = Anim;

  // Sticker "slapped" onto the page: starts big and rotated, snaps down with a small overshoot.
  Anim.slap = (t, start, { dur = 0.22, from = 1.18, rot = 0, spin = 0.08 } = {}) => {
    if (t < start) return { scale: 1, rot, alpha: 0 };
    const p = clamp01((t - start) / dur);
    return { scale: from + (1 - from) * ease.outBack(p), rot: rot + spin * (1 - ease.outCubic(p)), alpha: clamp01(p * 4) };
  };

  // Word pop: grows from `from` to 1 with an overshoot.
  Anim.pop = (t, start, { dur = 0.16, from = 0.55 } = {}) => {
    if (t < start) return { scale: 1, rot: 0, alpha: 0 };
    const p = clamp01((t - start) / dur);
    return { scale: from + (1 - from) * ease.outBack(p), rot: 0, alpha: clamp01(p * 3) };
  };

  // Heavy slam: enters oversized and hits its size fast (pair with Anim.shake for the impact).
  Anim.slam = (t, start, { dur = 0.12, from = 1.7 } = {}) => {
    if (t < start) return { scale: 1, rot: 0, alpha: 0 };
    const p = clamp01((t - start) / dur);
    return { scale: from + (1 - from) * ease.inCubic(p), rot: 0, alpha: clamp01(p * 2) };
  };

  // Decaying random offset {x, y} after `start` (camera-shake / impact jitter).
  Anim.shake = (t, start, { dur = 0.3, amp = 14 } = {}) => {
    const p = (t - start) / dur;
    if (p < 0 || p > 1) return { x: 0, y: 0 };
    const k = amp * Math.pow(1 - p, 2);
    return { x: random(-k, k), y: random(-k, k) };
  };

  // Starburst sparkle at (x, y): `progress` 0..1 blooms, spins and fades. Long + short rays and a hot core.
  Anim.sparkle = (x, y, r, progress, { color = "#ff3fa4", core = "#ffffff", rays = 8 } = {}) => {
    if (progress <= 0 || progress >= 1) return;
    const grow = ease.outBack(clamp01(progress * 2.2));
    const fade = 1 - clamp01((progress - 0.6) / 0.4);
    Anim.at(x, y, { rot: progress * 0.9, alpha: fade }, () => {
      noStroke();
      fill(color);
      for (let i = 0; i < rays; i++) {
        const len = r * grow * (i % 2 ? 0.55 : 1);
        const w = r * 0.09 * grow;
        push();
        rotate((i * TWO_PI) / rays);
        beginShape();
        vertex(0, -w);
        vertex(len, 0);
        vertex(0, w);
        vertex(-w * 0.5, 0);
        endShape(CLOSE);
        pop();
      }
      fill(core);
      circle(0, 0, r * 0.28 * grow);
      fill(color);
      circle(0, 0, r * 0.12 * grow);
    });
  };

  // Four-point twinkle star (small decoration), size scaled by `s`.
  Anim.twinkle = (x, y, s, color) => {
    if (s <= 0) return;
    push();
    translate(x, y);
    noStroke();
    fill(color);
    beginShape();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 ? s * 0.22 : s;
      const a = (i * PI) / 4 - HALF_PI;
      vertex(cos(a) * r, sin(a) * r);
    }
    endShape(CLOSE);
    pop();
  };

  // Circuit trace: polyline `points` [[x,y],...] drawn on up to `progress` (0..1 of total length),
  // with a solder dot on every reached vertex and a bigger pad at the head.
  Anim.trace = (points, progress, { color = "#2b3a7a", weight = 4, dot = 13, pad = 20 } = {}) => {
    if (progress <= 0) return;
    const segs = [];
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const d = dist(...points[i - 1], ...points[i]);
      segs.push(d);
      total += d;
    }
    let left = total * clamp01(progress);
    push();
    stroke(color);
    strokeWeight(weight);
    strokeCap(ROUND);
    noFill();
    const reached = [points[0]];
    let head = points[0];
    for (let i = 0; i < segs.length && left > 0; i++) {
      const k = Math.min(1, left / segs[i]);
      const [ax, ay] = points[i], [bx, by] = points[i + 1];
      head = [ax + (bx - ax) * k, ay + (by - ay) * k];
      line(ax, ay, ...head);
      if (k === 1) reached.push(points[i + 1]);
      left -= segs[i];
    }
    noStroke();
    fill(color);
    reached.slice(1).forEach(([x, y]) => circle(x, y, dot));
    circle(...head, progress >= 1 ? pad : dot);
    pop();
  };
})();
