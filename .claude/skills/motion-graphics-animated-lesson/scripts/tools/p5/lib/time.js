// Anim time: easing curves and timeline helpers. All times are in seconds.
window.Anim = window.Anim || {};

(() => {
  const c1 = 1.70158, c3 = c1 + 1;

  Anim.ease = {
    linear: (x) => x,
    inCubic: (x) => x * x * x,
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    outBack: (x) => 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2),
    outElastic: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1)
  };

  Anim.clamp01 = (x) => Math.min(1, Math.max(0, x));

  // 0..1 progress of t through [start, start + dur], eased.
  Anim.progress = (t, start, dur, ease = Anim.ease.linear) => ease(Anim.clamp01((t - start) / dur));

  // Value from `from` to `to` over [start, start + dur].
  Anim.tween = (t, start, dur, from, to, ease = Anim.ease.outCubic) => from + (to - from) * Anim.progress(t, start, dur, ease);

  // Is t inside [start, end)?
  Anim.live = (t, start, end = Infinity) => t >= start && t < end;

  // Visibility envelope 0..1: fades in over `fadeIn` after start, out over `fadeOut` before end (0 = hard cut).
  Anim.envelope = (t, start, end, fadeIn = 0, fadeOut = 0) => {
    if (t < start || t >= end) return 0;
    const a = fadeIn ? Anim.clamp01((t - start) / fadeIn) : 1;
    const b = fadeOut ? Anim.clamp01((end - t) / fadeOut) : 1;
    return Math.min(a, b);
  };

  // Step counter: how many `period`s have passed since start (for tickers / counters).
  Anim.steps = (t, start, period) => Math.max(0, Math.floor((t - start) / period));

  // Frames since the last step boundary — 0 on the frame a counter changes (for "just changed" jitter).
  Anim.sinceStep = (t, start, period) => Math.round((((t - start) % period) + period) % period * ANIM.fps);
})();
