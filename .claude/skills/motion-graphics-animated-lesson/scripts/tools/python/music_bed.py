#!/usr/bin/env python3
"""Background music beds under a narration, ducked by the voice (Media::MusicBed, rake music:bed).

usage: music_bed.py voice.wav bed.json bed_out.wav mix_out.wav

bed.json (written by Media::MusicBed from prompts/<name>/music.yml):
  duration            length of the output (s) = the video
  base_db             bed loudness (RMS dBFS, over its audible part) while nobody speaks
  duck_db             extra attenuation while the voice is active (negative, e.g. -9)
  loop_xf / join_xf   equal-power crossfade at a track's loop point / between consecutive segments (s)
  end                 the bed stops dead here (30 ms fade) — e.g. on the final stamp
  attack / release / hold / lookahead   sidechain envelope times (s); voice_lo_db / voice_hi_db: the voice loudness range mapped
                      to 0 → full ducking (a smoothstep in between)
  tracks              { name: { wav, gain_db } }
  segments            [{ from, to, track, gain_db, duck, fade_in, fade_out, restart, tape_stop, tape_start }]   song seconds;
                      restart: play the track from its top again; tape_stop / tape_start (s): a VCR-style speed ramp at the
                      segment's end (pitch slides to a halt) / start (spin-up)

Each track is trimmed of leading/trailing silence and loudness-normalised to base_db (+ its gain_db). A segment plays its track
from where that track's previous segment stopped (so recurring beds continue), looping with a crossfade as needed; segments
overlap by join_xf around each boundary with equal-power fades. The voice envelope (RMS of 20 ms hops, max-held over `hold` to
bridge the gaps between words, then attack/release smoothed and shifted `lookahead` earlier) drives a smooth gain reduction of up
to duck_db. The bed is added under the voice untouched; the sum passes a -1 dBFS peak limiter.
Prints a JSON report: per segment the bed level with the voice active vs idle, and the voice-to-bed margin.
"""
import json
import subprocess
import sys

import numpy as np

SR = 48000
HOP = 960  # 20 ms


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def encode(x, path):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-", path], input=pcm, check=True)


def db(v):
    return 20 * np.log10(np.maximum(v, 1e-9))


def hop_rms(x):
    m = x.mean(axis=1)
    n = len(m) // HOP
    return np.sqrt((m[: n * HOP].reshape(n, HOP) ** 2).mean(axis=1) + 1e-12)


def trim(x, thresh_db=-50.0):
    r = db(hop_rms(x))
    on = np.nonzero(r > thresh_db)[0]
    if not len(on):
        return x
    return x[on[0] * HOP: (on[-1] + 1) * HOP]


def rms_db(x, thresh_db=-50.0):
    r = hop_rms(x)
    a = r[db(r) > thresh_db]
    return float(db(np.sqrt((a ** 2).mean()))) if len(a) else -120.0


def eq_fade(n, rising=True):
    t = np.linspace(0, 1, n) if n > 1 else np.ones(1)
    g = np.sin(t * np.pi / 2)
    return g if rising else g[::-1]


class Looper:
    """Endless crossfaded loop of one track; read(n) continues where the last read stopped."""

    def __init__(self, x, xf):
        self.xf = min(int(xf * SR), len(x) // 4)
        self.x = x
        self.body = len(x) - self.xf  # one loop period
        self.pos = 0

    def sample(self, idx):
        p = idx % self.body
        out = self.x[p].copy()
        # the first xf samples of every period after the first blend in the previous period's tail (x[body + p])
        m = (p < self.xf) & (idx >= self.body)
        k = p[m]
        w = (k / self.xf) * np.pi / 2
        out[m] = self.x[k] * np.sin(w)[:, None] + self.x[self.body + k] * np.cos(w)[:, None]
        return out

    def read(self, n):
        idx = np.arange(self.pos, self.pos + n)
        self.pos += n
        return self.sample(idx)


def tape(x, stop=True):
    """VCR/turntable speed ramp over x: stop = the speed falls 1 → 0 (pitch slides down to nothing, starting where x starts);
    start = the speed rises 0 → 1 (spin-up, landing exactly where x ends so the normal playback continues seamlessly)."""
    n = len(x)
    rate = np.linspace(1, 0, n) if stop else np.linspace(0, 1, n)
    if stop:
        pos = np.concatenate([[0.0], np.cumsum(rate)[:-1]])
    else:
        pos = (n - 1) - np.concatenate([np.cumsum(rate[::-1])[::-1][1:], [0.0]])
    i = np.arange(n)
    return np.stack([np.interp(pos, i, x[:, c]) for c in range(x.shape[1])], axis=1)


def envelope(voice, cfg, n_out):
    lo, hi = cfg.get("voice_lo_db", -48.0), cfg.get("voice_hi_db", -32.0)
    r = db(hop_rms(voice))
    u = np.clip((r - lo) / (hi - lo), 0, 1)
    u = u * u * (3 - 2 * u)  # smoothstep: 0 idle .. 1 speaking
    hold = max(1, int(cfg.get("hold", 0.25) * SR / HOP))
    held = np.array([u[max(0, i - hold + 1): i + 1].max() for i in range(len(u))])
    la = int(cfg.get("lookahead", 0.12) * SR / HOP)
    held = np.concatenate([held[la:], np.zeros(la)])  # duck slightly before the voice arrives
    a = np.exp(-HOP / (SR * cfg.get("attack", 0.06)))
    rl = np.exp(-HOP / (SR * cfg.get("release", 0.45)))
    env = np.zeros_like(held)
    e = 0.0
    for i, v in enumerate(held):
        c = a if v > e else rl
        e = c * e + (1 - c) * v
        env[i] = e
    # per-sample, linear interpolation between hops
    t = (np.arange(len(env)) + 0.5) * HOP
    return np.interp(np.arange(n_out), t, env)


def limit(x, ceiling_db=-1.0, release=0.08):
    c = 10 ** (ceiling_db / 20)
    pk = np.abs(x).max(axis=1)
    need = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    g = np.empty_like(need)
    k = np.exp(-1 / (SR * release))
    cur = 1.0
    for i, v in enumerate(need):
        cur = v if v < cur else k * cur + (1 - k) * v
        g[i] = cur
    return x * g[:, None], g


def main():
    voice_path, cfg_path, bed_out, mix_out = sys.argv[1:5]
    cfg = json.load(open(cfg_path))
    n = int(round(cfg["duration"] * SR))
    voice = decode(voice_path)
    voice = np.pad(voice, ((0, max(0, n - len(voice))), (0, 0)))[:n]
    base = cfg.get("base_db", -30.0)
    loops = {}
    for name, t in cfg["tracks"].items():
        x = trim(decode(t["wav"]))
        x *= 10 ** ((base + t.get("gain_db", 0) - rms_db(x)) / 20)
        loops[name] = Looper(x, cfg.get("loop_xf", 2.0))
    bed = np.zeros((n, 2))
    duckable = np.zeros(n)
    jx = cfg.get("join_xf", 1.2)
    segs = cfg["segments"]
    for i, s in enumerate(segs):
        prev_join = i > 0 and abs(segs[i - 1]["to"] - s["from"]) < 1e-3
        next_join = i + 1 < len(segs) and abs(segs[i + 1]["from"] - s["to"]) < 1e-3
        fi = s.get("fade_in", jx if prev_join else 0.05)
        fo = s.get("fade_out", jx if next_join else 0.05)
        a = max(0, int((s["from"] - (fi / 2 if prev_join else 0)) * SR))
        b = min(n, int((s["to"] + (fo / 2 if next_join else 0)) * SR))
        if b <= a:
            continue
        if s.get("restart"):
            loops[s["track"]].pos = 0
        x = loops[s["track"]].read(b - a) * 10 ** (s.get("gain_db", 0) / 20)
        nts, ntu = min(int(s.get("tape_stop", 0) * SR), b - a), min(int(s.get("tape_start", 0) * SR), b - a)
        if nts > 1:
            x[len(x) - nts:] = tape(x[len(x) - nts:], stop=True)
        if ntu > 1:
            x[:ntu] = tape(x[:ntu], stop=False)
        nfi, nfo = min(int(fi * SR), b - a), min(int(fo * SR), b - a)
        x[:nfi] *= eq_fade(nfi, True)[:, None]
        x[len(x) - nfo:] *= eq_fade(nfo, False)[:, None]
        bed[a:b] += x
        duckable[a:b] = np.maximum(duckable[a:b], 1.0 if s.get("duck", True) else 0.0)
    env = envelope(voice, cfg, n)
    gain = 10 ** (cfg.get("duck_db", -9.0) * env * duckable / 20)
    bed *= gain[:, None]
    if cfg.get("end"):
        e = int(cfg["end"] * SR)
        f = int(0.03 * SR)
        if e < n:
            bed[e:] = 0
            bed[max(0, e - f): e] *= np.linspace(1, 0, min(f, e))[:, None]
    mix, g = limit(voice + bed, cfg.get("peak_db", -1.0))
    encode(bed, bed_out)
    encode(mix, mix_out)
    # report
    rv = db(hop_rms(voice))
    rb = db(hop_rms(bed))
    speaking = rv > cfg.get("voice_hi_db", -32.0)
    rep = []
    for s in segs:
        a, b = int(s["from"] * SR / HOP), int(min(s["to"], cfg.get("end") or s["to"]) * SR / HOP)
        sp, idle = speaking[a:b], ~speaking[a:b]
        pw = lambda v, m: round(float(db(np.sqrt(np.mean((10 ** (v[m] / 20)) ** 2)))), 1) if m.any() else None
        rep.append({"track": s["track"], "from": s["from"], "to": s["to"],
                    "bed_idle_db": pw(rb[a:b], idle), "bed_speaking_db": pw(rb[a:b], sp), "voice_db": pw(rv[a:b], sp),
                    "speaking_pct": round(100 * float(sp.mean()), 1) if b > a else 0})
        if rep[-1]["voice_db"] is not None and rep[-1]["bed_speaking_db"] is not None:
            rep[-1]["voice_over_bed_db"] = round(rep[-1]["voice_db"] - rep[-1]["bed_speaking_db"], 1)
    print(json.dumps({"segments": rep, "bed_peak_db": round(float(db(np.abs(bed).max())), 1),
                      "mix_peak_db": round(float(db(np.abs(mix).max())), 1), "limiter_db": round(float(db(g.min())), 1)}))


if __name__ == "__main__":
    main()
