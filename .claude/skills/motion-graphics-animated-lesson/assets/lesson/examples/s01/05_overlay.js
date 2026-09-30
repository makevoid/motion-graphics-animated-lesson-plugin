// s01 cold open (song 0.00–14.25 s, frames 0–342). The narration is the song; words are section-local (anim:prepare).
// World = the `hall` plate in 1920×1080 units; the sketch redraws the plate inside the camera so the pull-back reveals the hall.
// p01 1.52–8.88 voice-over over a full-screen terminal: `git log --reverse` typed, the first commit appears on "two words".
// p02 9.55–13.87 "Initial commit" hash stamp → pull back to the chalkboard projection, prof (H3 prof_open) slides in from the
// left, chalk "NOV 14 2022" + "ChatGPT in 16 days" + 16 tally marks, ChatGPT robot asleep on a stool at the right ("z z").
//
// Plate landmarks (1920×1080 units): board inner rect x237 y87 w1430 h529 (lamps hang over its top edge to y≈100),
// stage floor front edge y≈874, arched window from x≈1790. Layout: prof x≈0–620 (bottom-anchored), terminal centre,
// chalk notes right of it, robot on the stool bottom-right in front of the panelling.
const W = 1920, H = 1080;
const SCREEN = { x: 610, y: 122, w: 700, h: 394 };  // 16:9 projection, so the zoomed-in start fills the frame
const NOTES = { x: 1342, y: 128 };                  // chalk column, right of the screen, inside the board (x ≤ 1655)
const CMD = "$ git log --reverse --format='%h %ad %s' --date=iso";
const FIRST = ["63bd846", "2022-11-14 05:55:31 +0000", "initial commit"];  // PLAN §Source (verified)
// prof_open (take 1) has a slow H3 push-in: measured with media:track (bow tie + elbow patch) the sprite scale grows
// ≈ linearly 1.000 → 1.167 over its 124 frames around source point (925, 200). We divide it back out so the camera reads
// locked; the sprite is placed with its bottom 110 units below the frame so the lifted cut edge never shows.
const DRIFT = { perFrame: 0.167 / 120, cx: 925, cy: 200 };
const PROF = { k: 0.85, bottom: 1190, x: -395 };     // source px → world units, source bottom edge, left of the source frame

Anim.sketch({
  async load() {
    this.f = await Anim.fonts({ chalk: "chalk.ttf", mono: "mono.ttf", tag: "din-alt.ttf", title: "din-cond.ttf", body: "body-med.ttf" });
    this.plate = await new Promise((ok, no) => loadImage("/output/s01/02_kf_hall.png", ok, no));
    this.prof = await Anim.clip("prof_open");
    this.chat = await Anim.clip("chatgpt_sleep");
    // the still is the full 2752×1536 keyframe (box = whole frame): crop it to the robot's alpha bounds (x930-1830 y81-1302)
    this.robot = this.chat.frame(0).get(924, 75, 912, 1234);
    this.stool = await new Promise((ok) => loadImage("/output/props-a-v1/sprites/stool.png", ok, () => ok(null)));
    this.words = Anim.data("words");
    this.cue = Anim.cues(this.words);
    this.ph = Ex.phrases(this.words);
  },

  terminal(t) {
    const f = this.f, c = this.cue;
    const o = Ex.window(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, { title: "~/gpt3_generate_app — zsh", theme: "terminal", font: f.body, shadow: false, radius: 10 });
    textFont(f.mono); textSize(16); textAlign(LEFT, TOP); noStroke();
    const lh = 28;
    // command typed from "November" to "morning."
    const t0 = c("November").s, t1 = c("morning.").e;
    const n = Math.floor(CMD.length * Anim.clamp01((t - t0) / (t1 - t0)));
    fill(Ex.C.amber); Ex.text(CMD.slice(0, 1), o.x - 8, o.y);
    fill(Ex.C.codeFg); Ex.text(CMD.slice(2, Math.max(2, n)), o.x + 8, o.y);
    const typed = n >= CMD.length;
    // the first commit prints on "two", its message typed through "words."
    const tw = c("two").s, rows = [];
    if (t >= tw) {
      const y = o.y + lh * 1.6;
      const [h, d, m] = FIRST;
      const lit = t >= c("Initial").s;  // row flashes amber when the hash is stamped
      if (lit) { fill(255, 181, 61, 40); rect(o.x - 12, y - 5, SCREEN.w - 24, lh + 2, 4); }
      fill(Ex.C.amber); Ex.text(h, o.x - 8, y);
      fill(Ex.C.codeCom); Ex.text(d, o.x + 76, y);
      const msg = m.slice(0, Math.ceil(m.length * Anim.clamp01((t - tw) / (c("words.").e - 0.25 - tw))));
      fill("#FFFFFF"); Ex.text(msg, o.x + 334, y);
      rows.push({ y, x: o.x + 334 + Ex.tw(msg) });
    }
    // on "Sixteen" the rest of the history scrolls in as one dim line (17 commits in total)
    if (t >= c("Sixteen").s) {
      const y = o.y + lh * 2.8;
      fill(Ex.C.codeCom); Ex.text("… 16 more commits (2022-11-14 → 2022-11-29)", o.x - 8, y);
      rows.push({ y, x: -1 });
    }
    // cursor: blinking before typing and after the output, solid while typing
    const blink = Math.floor(t * 2.2) % 2 === 0;
    let cx, cy;
    if (!rows.length) { cx = o.x + 8 + Ex.tw(CMD.slice(2, Math.max(2, n))) + (n > 2 ? 3 : 0); cy = o.y; }
    else if (rows.length === 1 && t < c("words.").e) { cx = rows[0].x + 3; cy = rows[0].y; }
    else { cx = o.x - 8; cy = rows[rows.length - 1].y + lh * 1.2; }
    const solid = n > 0 && !typed;
    if (solid || blink) { fill(Ex.C.amber); rect(cx, cy, 10, 20); }
    return o;
  },

  tallies(t, x, y) {
    const t0 = this.cue("Sixteen").s, t1 = this.cue("ChatGPT.").e;
    for (let i = 0; i < 16; i++) {
      const p = Anim.clamp01(((t - t0) / (t1 - t0)) * 16 - i);
      if (p <= 0) continue;
      const g = Math.floor(i / 5), k = i % 5, gx = x + g * 70;
      if (k < 4) Ex.chalkLine([[gx + k * 12, y], [gx + k * 12 + 3, y + 54]], p * 1.4, { weight: 5, seed: 20 + i });
      else Ex.chalkLine([[gx - 8, y + 40], [gx + 46, y + 12]], p * 1.4, { weight: 5, seed: 20 + i });
    }
  },

  // H3 frame placed with the source framing, drift divided out around (DRIFT.cx, DRIFT.cy)
  drawProf(t, dx) {
    const img = this.prof.at(t);
    const fi = Math.min(this.prof.frames - 1, Math.max(0, (t - this.prof.audio_at) * 24));
    const s = 1 + DRIFT.perFrame * fi;
    const k = PROF.k, ox = PROF.x + dx, oy = PROF.bottom - this.prof.src[1] * k;
    const px = ox + DRIFT.cx * k, py = oy + DRIFT.cy * k;
    push(); translate(px, py); scale(1 / s); translate(-px, -py);
    this.prof.place(img, ox, oy, this.prof.src[0] * k);
    pop();
  },

  draw(t) {
    const f = this.f, c = this.cue, K = width / W;
    background(Ex.C.ink);
    const slam = c("Initial").s;                    // 9.55 hash stamp
    const pull = slam + 0.15, pullEnd = slam + 1.25;  // pull-back 9.70 → 10.80 (prof visible for "commit")
    const zIn = W / (SCREEN.w * 1.035);
    const cx = SCREEN.x + SCREEN.w / 2, cy = SCREEN.y + SCREEN.h / 2;
    const cam = Ex.cam(t, [
      { t: 0, x: cx, y: cy, z: zIn * 1.07 },
      { t: slam, x: cx, y: cy, z: zIn, ease: "inOutCubic" },
      { t: pull, x: cx, y: cy, z: zIn },
      { t: pullEnd, x: W / 2, y: H / 2, z: 1, ease: "inOutCubic" },
      { t: 14.25, x: W / 2 - 12, y: H / 2 + 4, z: 1.03, ease: "linear" }
    ]);
    const shake = t > slam && t < slam + 0.22 ? [Math.sin(t * 90) * 10 * K * (1 - (t - slam) / 0.22), 0] : [0, 0];
    Ex.withCam({ ...cam, z: cam.z * K }, () => {
      imageMode(CORNER); image(this.plate, 0, 0, W, H);
      // projector glow around the screen once the room is visible
      noStroke(); fill(255, 214, 150, 16 * Anim.clamp01((t - pull) / 1.2)); rect(SCREEN.x - 24, SCREEN.y - 20, SCREEN.w + 48, SCREEN.h + 40, 18);
      this.terminal(t);
      Ex.stamp(t, slam, "63bd846", SCREEN.x + SCREEN.w - 150, SCREEN.y + SCREEN.h - 78, { font: f.title, size: 60, color: Ex.C.pink, rot: -0.1 });
      // chalk notes on the board, right of the screen
      Ex.chalk("NOV 14 2022", NOTES.x, NOTES.y + 50, { font: f.chalk, size: 36, progress: (t - (c("commit.").s + 0.1)) / 0.7 });
      Ex.chalk("ChatGPT in", NOTES.x, NOTES.y + 128, { font: f.chalk, size: 34, progress: (t - c("Sixteen").s) / 0.6 });
      Ex.chalk("16 days", NOTES.x, NOTES.y + 178, { font: f.chalk, size: 34, progress: (t - c("days").s + 0.1) / 0.5 });
      Ex.chalkLine([[NOTES.x - 2, NOTES.y + 192], [NOTES.x + 170, NOTES.y + 188]], (t - c("before").s) / 0.35, { weight: 4, seed: 9 });
      this.tallies(t, NOTES.x + 6, NOTES.y + 218);
      // ChatGPT robot dozing on the stool, stage-right in front of the panelling; startles on "ChatGPT", then dozes off again
      const sx = 1575, floor = 874, stoolH = 190, stoolTop = floor - stoolH;
      const rIn = pull + 0.5;
      if (t > rIn) {
        const a = Anim.clamp01((t - rIn) / 0.4);
        if (this.stool) Ex.img(this.stool, sx, floor, stoolH, { anchor: "bottom", alpha: a });
        const g = c("ChatGPT.").s, j = t - g;
        const hop = j > 0 && j < 0.7 ? Math.sin(Math.min(1, j / 0.7) * PI) * 16 : 0;
        const wobble = j > 0 && j < 0.9 ? Math.sin(j * 30) * 0.06 * (1 - j / 0.9) : 0;
        Ex.puppet(this.robot, t, { x: sx, y: stoolTop + 22 - hop, h: 250, t0: rIn, from: "fade", bob: 2, speed: 0.3, breathe: 0.03, tilt: -0.05 + wobble, anchor: "bottom" });
        // z z drifting up from the head (paused for a beat while it startles)
        if (!(j > -0.05 && j < 0.9)) for (let i = 0; i < 3; i++) {
          const zt = ((t * 0.5 + i / 3) % 1);
          Ex.chalk("z", sx + 4 + zt * 32 + i * 3, stoolTop - 238 - zt * 110, { font: f.chalk, size: 30 + zt * 22, alpha: a * Math.sin(zt * PI) });
        }
        if (j > 0 && j < 0.8) Ex.chalk("!", sx - 100, stoolTop - 208, { font: f.chalk, size: 56, alpha: 1 - j / 0.8 });
      }
      // Professor: slides in from the left during the pull-back; lip-synced H3 clip (audio_at 9.25)
      const enter = pull + 0.05;
      if (t > enter) {
        const k = Anim.ease.outCubic(Anim.clamp01((t - enter) / 0.6));
        this.drawProf(t, -720 * (1 - k));
      }
    }, shake);
    // screen space: date lower third during p01 (above the captions), captions, vignette
    Ex.lowerThird(t, c("November").s + 0.2, c("words.").e, { fonts: { tag: f.tag, title: f.title, body: f.body }, tag: "SOFTWARE ARCHAEOLOGY",
      title: "Mon 14 Nov 2022 · 05:55 UTC · 06:55 UTC+1", sub: "commit 63bd846 · 05:55:31 +0000 · github.com/makevoid/gpt3_generate_app", x: 90 * K, y: height - 330 * K });
    Ex.caption(t, this.ph, { font: f.body, size: 34 * K, y: height - 52 * K, speakers: { prof: "#FFFFFF" } });
    Ex.vignette(0.3 + 0.25 * (1 - Anim.clamp01((t - pull) / 1.4)));
  }
});
