require_relative "shell"

module Media
  # ImageMagick 7 (`magick`) wrapper for inspection and review boards.
  class ImageMagick < Shell
    def identify(path)
      w, h, fmt = run("magick", "identify", "-format", "%w %h %m", "#{path}[0]", quiet: true).split
      { w: w.to_i, h: h.to_i, format: fmt, aspect: (w.to_f / h.to_i).round(3) }
    end

    # Downscaled JPEG preview (keeps review images small enough to inspect).
    def preview(path, out, max: 1280)
      run("magick", path, "-resize", "#{max}x#{max}>", "-quality", "88", out)
      out
    end

    # Labeled side-by-side board: pairs = [[path, label], ...]
    def board(pairs, out, tile: "#{pairs.size}x1", width: 900)
      args = pairs.flat_map { |path, label| ["-label", label, path] }
      run("magick", "montage", "-font", FONT, *args, "-tile", tile, "-geometry", "#{width}x+8+8",
          "-pointsize", "22", "-background", "#222", "-fill", "white", out)
      out
    end

    # Grayscale-vs-color diff mask: white where pixels are low-saturation (line-art),
    # black where colored. Useful to eyeball the hand-drawn/colored split.
    # Share (0..1) of an RGBA image that is covered, i.e. its mean alpha.
    def alpha_coverage(path)
      run("magick", path, "-alpha", "extract", "-format", "%[fx:mean]", "info:", quiet: true).to_f
    end

    def saturation_mask(path, out, threshold: 12)
      run("magick", path, "-colorspace", "HSL", "-channel", "G", "-separate", "+channel",
          "-threshold", "#{threshold}%", "-negate", out)
      out
    end
  end
end
