require_relative "python"

module Media
  # Preserve a seeded alpha silhouette while discarding detached marks in each frame.
  class SpriteComponents
    def keep(source, out, seed_x, seed_y)
      source = File.realpath(source)
      out = File.expand_path(out)
      resolved_out = File.exist?(out) ? File.realpath(out) : out
      raise ArgumentError, "Source and output must be different directories" if source == resolved_out
      x, y = Integer(seed_x), Integer(seed_y)
      raise ArgumentError, "Seed coordinates must be nonnegative integers" if x.negative? || y.negative?
      Python.new.call("keep_component.py", source, out, x.to_s, y.to_s)
    end
  end
end
