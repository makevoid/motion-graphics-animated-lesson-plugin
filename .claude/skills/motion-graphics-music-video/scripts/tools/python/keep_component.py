"""Keep the four-connected nonzero-alpha component containing an explicit seed.

No erosion, dilation, resampling or synthesis: every selected RGBA pixel is exact.
Touching lettering is part of the same component and requires a separate mask.
Stage the complete sequence before publication so a missing seed cannot leave a
partially cleaned sequence that looks successful.
"""
import argparse
import json
import os
from pathlib import Path
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw


def clean_sequence(source, output, seed_x, seed_y):
    source, output = Path(source).resolve(), Path(output).resolve()
    if source == output:
        raise ValueError("source and output must be different directories")
    if not source.is_dir():
        raise ValueError("source must be a PNG sequence directory")
    if seed_x < 0 or seed_y < 0:
        raise ValueError("seed coordinates must be nonnegative")
    frames = sorted(source.glob("*.png"))
    if not frames:
        raise ValueError("source contains no PNG frames")
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        raise ValueError("output must be a new or empty directory; retain earlier takes")
    output.parent.mkdir(parents=True, exist_ok=True)
    metrics = []
    with tempfile.TemporaryDirectory(prefix=".component-", dir=output.parent) as temp:
        stage = Path(temp) / "frames"
        stage.mkdir()
        for path in frames:
            with Image.open(path) as original:
                if "A" not in original.getbands() and "transparency" not in original.info:
                    raise ValueError(f"{path.name}: PNG has no alpha channel")
                image = original.convert("RGBA")
            if seed_x >= image.width or seed_y >= image.height:
                raise ValueError(f"{path.name}: seed is outside image bounds")
            rgba = np.array(image)
            alpha = rgba[:, :, 3]
            if alpha[seed_y, seed_x] == 0:
                raise ValueError(f"{path.name}: seed component is absent (transparent seed)")
            # Explicit copy makes Pillow's NumPy-backed image writable for floodfill.
            mask = Image.fromarray(np.where(alpha > 0, 255, 0).astype(np.uint8)).copy()
            ImageDraw.floodfill(mask, (seed_x, seed_y), 128)
            keep = np.asarray(mask) == 128
            removed = int(np.count_nonzero((alpha > 0) & ~keep))
            rgba[:, :, 3] = np.where(keep, alpha, 0)
            Image.fromarray(rgba).save(stage / path.name)
            metrics.append({"frame": path.name, "removed_pixels": removed,
                            "remaining_pixels": int(np.count_nonzero(keep))})
        os.replace(stage, output)
    return {"out": str(output), "frames": len(metrics), "seed": [seed_x, seed_y],
            "connectivity": 4, "metrics": metrics}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source")
    parser.add_argument("output")
    parser.add_argument("seed_x", type=int)
    parser.add_argument("seed_y", type=int)
    args = parser.parse_args()
    try:
        result = clean_sequence(args.source, args.output, args.seed_x, args.seed_y)
    except (ValueError, OSError) as error:
        print(f"keep_component: {error}", file=sys.stderr)
        return 1
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
