#!/usr/bin/env python3
"""Lay narration/dialogue lines on one timeline: the master voice track plus one full-length stem per speaker.

usage: narration_mix.py PLAN.json
PLAN = {"rate": 48000, "lead_in": 0.8, "tail": 2.0, "gap": 0.35, "trim_db": -45, "target_db": -20,
        "out": "audio/source.wav", "stems": "audio/stems",
        "lines": [{"sound": "p01", "wav": ".../p01.wav", "speaker": "prof", "gap": 0.2 | "at": 12.5 | "overlap": 0.3,
                   "gain_db": 0}]}
Every line wav is mono 16-bit at `rate`. Leading/trailing silence below trim_db is trimmed, the line is levelled to target_db
RMS (+gain_db) and placed `gap` seconds after the previous line ends (or at an absolute `at`, or `overlap` s before the end).
Stems (<stems>/<speaker>.wav) share the master's length and sample grid, so an H3 lip-sync cut from a stem lines up with the
master. Prints JSON {"duration", "lines": [{"sound", "speaker", "at", "dur", "trim"}]} (seconds; trim = seconds cut from the start).
"""
import json
import os
import sys
import wave

import numpy as np


def read(path):
    with wave.open(path, "rb") as w:
        if w.getsampwidth() != 2 or w.getnchannels() != 1:
            raise SystemExit(f"{path}: expected mono 16-bit wav")
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0, w.getframerate()


def write(path, data, rate):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    pcm = (np.clip(data, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm.tobytes())


def trim_bounds(x, rate, db):
    win = int(rate * 0.01)
    n = len(x) // win
    if n == 0:
        return 0, len(x)
    rms = np.sqrt((x[: n * win].reshape(n, win) ** 2).mean(1) + 1e-12)
    loud = np.nonzero(20 * np.log10(rms) > db)[0]
    if len(loud) == 0:
        return 0, len(x)
    start = max(0, loud[0] * win - int(rate * 0.03))      # keep 30 ms of breath before the first word
    end = min(len(x), (loud[-1] + 1) * win + int(rate * 0.08))
    return start, end


def main():
    plan = json.load(open(sys.argv[1]))
    rate = plan.get("rate", 48000)
    placed, cursor = [], plan.get("lead_in", 0.8)
    for line in plan["lines"]:
        x, r = read(line["wav"])
        if r != rate:
            raise SystemExit(f"{line['wav']}: rate {r} != {rate}")
        s, e = trim_bounds(x, rate, plan.get("trim_db", -45))
        x = x[s:e]
        rms_db = 20 * np.log10(np.sqrt((x ** 2).mean() + 1e-12))
        x = x * 10 ** ((plan.get("target_db", -20) - rms_db + line.get("gain_db", 0)) / 20)
        if "at" in line:
            at = float(line["at"])
        elif "overlap" in line:
            at = cursor - float(line["overlap"])
        else:
            at = cursor + float(line.get("gap", plan.get("gap", 0.35) if placed else 0))
        placed.append((line, x, at, s / rate))
        cursor = max(cursor, at + len(x) / rate)
    total = cursor + plan.get("tail", 2.0)
    n = int(round(total * rate))
    master = np.zeros(n, np.float32)
    stems = {}
    for line, x, at, _ in placed:
        i = int(round(at * rate))
        seg = x[: max(0, n - i)]
        master[i : i + len(seg)] += seg
        stem = stems.setdefault(line.get("speaker", "voice"), np.zeros(n, np.float32))
        stem[i : i + len(seg)] += seg
    peak = float(np.abs(master).max() or 1)
    gain = min(1.0, 0.89 / peak)                          # -1 dBFS ceiling
    write(plan["out"], master * gain, rate)
    for speaker, stem in stems.items():
        write(os.path.join(plan["stems"], f"{speaker}.wav"), stem * gain, rate)
    print(json.dumps({
        "duration": round(n / rate, 4), "gain": round(gain, 4),
        "lines": [{"sound": l["sound"], "speaker": l.get("speaker", "voice"), "at": round(at, 4), "dur": round(len(x) / rate, 4),
                   "trim": round(trim, 4)} for l, x, at, trim in placed]}))


if __name__ == "__main__":
    main()
