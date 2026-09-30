#!/usr/bin/env python3
"""Hard cuts of a video: frames whose picture differs sharply from the previous one (mean abs diff of 96x54 grey thumbnails).

usage: cuts.py video.mp4 [threshold]
prints JSON: {frames, cuts: [{f, diff}], diff: [per-frame diff]}  (cut = diff ≥ threshold and ≥ 3x the median of its ±6 neighbours)
"""
import json
import subprocess
import sys

import numpy as np

W, H = 96, 54


def main():
    video = sys.argv[1]
    thr = float(sys.argv[2]) if len(sys.argv) > 2 else 18.0
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H, W).astype(np.float32)
    diff = np.concatenate([[0.0], np.abs(np.diff(frames, axis=0)).mean(axis=(1, 2))])
    cuts = []
    for i in range(1, len(diff)):
        near = np.concatenate([diff[max(i - 6, 1):i], diff[i + 1:i + 7]])
        if diff[i] >= thr and diff[i] >= 3 * (np.median(near) if len(near) else 0):
            cuts.append({"f": i, "diff": round(float(diff[i]), 1)})
    print(json.dumps({"frames": len(frames), "cuts": cuts, "diff": [round(float(d), 1) for d in diff]}))


if __name__ == "__main__":
    main()
