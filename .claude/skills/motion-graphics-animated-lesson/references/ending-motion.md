# Reusable ending motion

These recipes extract the timing and compositing techniques from `video-session14/aicodegen` without the archived supporting cast. Use the [ending layout template](../assets/templates/ending/TEMPLATE.md) for typography and the [ending workflow](ending-and-credits.md) for audio and credits. Coordinates are 1920×1080; time is section-local seconds unless stated otherwise. Draw each frame from its timestamp so previews and full renders agree.

## Reaction and iris

After the final spoken word, stop the teaching bed, hold two seconds of silence and use a restrained 1.00→1.04 camera push on the professor or developer. Play the tada as a one-second iris begins. Draw this last, outside any camera transform, using the actual canvas dimensions:

```js
function iris(t, start, end) {
  if (t < start) return;
  const u = Anim.clamp01((t - start) / (end - start));
  const r = (Math.hypot(width, height) / 2 + 20) * (1 - Anim.ease.inCubic(u));
  push(); noStroke(); fill(0);
  beginShape();
  vertex(-10, -10); vertex(width + 10, -10);
  vertex(width + 10, height + 10); vertex(-10, height + 10);
  beginContour();
  for (let i = 0; i <= 96; i++) {
    const a = -TWO_PI * i / 96;
    vertex(width / 2 + r * Math.cos(a), height / 2 + r * Math.sin(a));
  }
  endContour(); endShape(CLOSE);
  if (r > 2) {
    noFill(); stroke(255, 181, 61, 90); strokeWeight(3 * width / 1920);
    circle(width / 2, height / 2, 2 * r);
  }
  pop();
}
```

## Folding curtain and continuous card clock

Prepare `curtain_close` and `curtain_open` through `source:` clips with `key: green`, then load both with `await Anim.clip(name)` inside `async load()`. The source timing maps are pairs of `[section time, clip time]`:

```js
const curtainClose = [[0.15, 0.4], [2.5, 2.75], [3.6, 4.4]];
const curtainOpen = [[3.6, 0.5], [6.4, 3.6], [7.0, 4.2]];
const cardStart = 4.25;
function clipTime(points, t) {
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [a, av] = points[i - 1], [b, bv] = points[i];
    if (t <= b) return av + (bv - av) * (t - a) / (b - a);
  }
  return points[points.length - 1][1];
}
```

Draw black first. At `t >= cardStart`, draw the card using `u = t - cardStart`. Draw the keyed curtain above it: the close clip until 3.6 seconds, the open clip thereafter. Select a prepared 24fps frame with `clip.frame(clipTime(map, t) * 24)` and place it with `clip.place(frame, 0, 0, 1920)`. Fade the curtain in over 0–0.3 seconds. During 6.1–6.9 seconds, ease its scale from 1 to 1.35 around the canvas centre and its opacity to zero. Inspect the closed-frame match at the clip switch and adjust the maps to the prepared clips.

The original section lasted 246 frames. If retaining that length, the next section begins at card time `246 / 24 - 4.25 = 6.0`; its last preceding card frame was 5.9583 seconds. For a changed section length, compute this offset from its frame count. Carry the same clock into any continued card or developer run; do not restart an entrance at the join. Retime only silent curtain/acting loops, never speech.

## Developer run and animated credit faces

Prepare only selected loops:

```yaml
- name: face_prof
  source: .skill/assets/lesson/loops/face_prof.mp4
  key: green
- name: face_dev
  source: .skill/assets/lesson/loops/face_luca.mp4
  key: green
- name: run_dev
  source: .skill/assets/lesson/loops/run_luca.mp4
  key: green
```

`luca` is the source filename for the developer, not a third character. These silent loops do not supply dialogue for a new lesson. Use the professor and developer face loops in alternating circular credit vignettes. A small chalk tick suits the professor; a drowsy letter or reaction suits the developer if set up in the script. Omit unused roles entirely.

For the developer run, measure each prepared frame's alpha bounds and opaque-pixel horizontal centroid at load time. The source used alpha >140 and sampling every two pixels. Circularly smooth centroid and lowest opaque pixel across ±5 frames; scale using the median opaque figure height. Ignore empty frames and reject a loop with no visible frames. Exclude a duplicated last frame only after checking it matches the first.

At frame time, let `s = targetHeight / medianHeight`. Place the image at `x - centroidX * s, groundY - bottomY * s`, with dimensions `image.width * s, image.height * s`. Travel is independent of the acting: `x = 2140 - 330 * (u - entryTime)` is the original relaxed right-to-left pace. Ground 1040 and target height 225 keep the developer under the source card. A soft contact shadow and ≤3 px stride bob ground the feet. Preview the full path against the new layout before choosing entry time.

## Readable credit scroll

Build a strip from measured text blocks: title, selected cast, actual production/model credits, relevant joke credits, final callback. Wrap text before calculating each block's height. Use two 760 px crew columns starting at x160 and x1000; retain the template's safe margins. Draw blocks at `blockY - scroll(t)` and skip offscreen blocks.

Integrate speed rather than easing the entire long strip. For a hold followed by linear acceleration, cruise and deceleration, calculate cruise speed so the final card stops centred:

```js
// finalY is the final card's centre in strip coordinates.
function creditMotion(finalY, offset, hold, rampIn, stop, rampOut) {
  const cruiseSeconds = stop - rampOut - hold - rampIn;
  if (cruiseSeconds < 0) throw new Error('Credits need more time');
  const speed = (finalY - 540 - offset) / (rampIn / 2 + cruiseSeconds + rampOut / 2);
  const points = [[0, 0], [hold, 0], [hold + rampIn, speed],
    [stop - rampOut, speed], [stop, 0]];
  return t => {
    let y = offset;
    for (let i = 1; i < points.length; i++) {
      const [a, va] = points[i - 1], [b, vb] = points[i];
      if (t <= a) break;
      if (b <= a) continue;
      const elapsed = Math.min(t, b) - a;
      const v = va + (vb - va) * elapsed / (b - a);
      y += (va + v) * elapsed / 2;
    }
    return y;
  };
}
```

The source used a 1.4-second initial hold, 1.2-second acceleration and 1.5-second deceleration. Recalculate the total duration for the two-character cast; each credit must remain readable for at least 2.5 seconds. Hold the final joke card for at least 2.5 seconds after stopping, and stop the titles music on its payoff. Take actual voice/model names from current manifests: professor George and developer Liam are the defaults, both ElevenLabs Eleven v4. Never inherit old producer or model claims.
