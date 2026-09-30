#!/usr/bin/env python3
"""Measure how much of an image is monochrome line-art vs colored.

usage: style_split.py img1.png [img2.png ...]
prints JSON: {"images": [{path, mono_pct, color_pct, left_mono_pct, right_mono_pct,
              band_mono_pct: [top..bottom thirds]}], "mean_mono_pct": x}
"""
import json
import sys

import numpy as np
from PIL import Image

SAT_THRESHOLD = 0.12  # HSV saturation below this counts as monochrome


def analyze(path):
    img = Image.open(path).convert("RGB")
    img.thumbnail((768, 768))
    hsv = np.asarray(img.convert("HSV"), dtype=np.float32) / 255.0
    sat, val = hsv[..., 1], hsv[..., 2]
    # ignore near-black pixels (saturation is meaningless there)
    valid = val > 0.15
    mono = (sat < SAT_THRESHOLD) & valid
    h, w = mono.shape

    def pct(mask, region=np.s_[:, :]):
        v = valid[region].sum()
        return round(100.0 * mask[region].sum() / v, 1) if v else 0.0

    thirds = [np.s_[i * h // 3:(i + 1) * h // 3, :] for i in range(3)]
    return {
        "path": path,
        "mono_pct": pct(mono),
        "color_pct": round(100.0 - pct(mono), 1),
        "left_mono_pct": pct(mono, np.s_[:, : w // 2]),
        "right_mono_pct": pct(mono, np.s_[:, w // 2:]),
        "band_mono_pct": [pct(mono, t) for t in thirds],
        "mean_saturation": round(float(sat[valid].mean()), 3),
    }


def main():
    results = [analyze(p) for p in sys.argv[1:]]
    mean = round(sum(r["mono_pct"] for r in results) / len(results), 1) if results else 0
    print(json.dumps({"images": results, "mean_mono_pct": mean}))


if __name__ == "__main__":
    main()
