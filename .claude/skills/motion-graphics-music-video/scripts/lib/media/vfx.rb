require "json"
require "yaml"
require_relative "shell"
require_relative "anim"
require_relative "ffmpeg"
require_relative "python"

module Media
  # Post-processing VFX over a finished video (the full-song preview): a cue list (prompts/<name>/cues.yml) drives
  #   - vfx/ (Swift, Core Image): punch zoom shake whip mblur edgeblur glow flash dark rgb glitch tv, and
  #   - prompts/<name>/05_lights.js (p5): leak flare glints, rendered only on their frames and screen-blended in by vfx/.
  # Output goes to output/<name>/ (analysis, cues.json, lights/, stills/, clips) and the cue file's `out:` (the full render).
  # The source video is only read: the VFX version is a new file.
  class Vfx < Shell
    ROOT = File.expand_path("../..", __dir__)
    PACKAGE = File.join(ROOT, "tools", "vfx")
    BIN = File.join(PACKAGE, ".build", "release", "mvfx")
    CORE_IMAGE = %w[punch zoom shake whip mblur edgeblur glow flash dark rgb glitch tv grain].freeze
    LIGHTS = %w[leak flare glints].freeze

    attr_reader :name, :dir

    def initialize(name = ENV.fetch("VFX", "run4-vfx"))
      @name = name
      @dir = File.join(ROOT, "output", name)
      FileUtils.mkdir_p(@dir)
    end

    def config = @config ||= YAML.safe_load_file(File.join(ROOT, "prompts", name, "cues.yml"))
    def source = File.expand_path(config.fetch("source"), ROOT)
    def out = File.expand_path(config.fetch("out"), ROOT)
    # The light sketch: cues.yml `lights:` (e.g. another revision's), else prompts/<name>/05_lights.js.
    def sketch = File.join(ROOT, config["lights"] || File.join("prompts", name, "05_lights.js"))
    def path(file) = File.join(dir, file)

    # Song beat grid + onsets (scripts/beats.py) and picture cuts (scripts/cuts.py) of the source, for placing cues.
    def analyze
      wav = FFmpeg.new.extract_audio(source, path("song.wav"))
      File.write(path("beats.json"), run(Media::Python.new.executable, File.join(Python::SCRIPTS, "beats.py"), wav, "24", quiet: true))
      File.write(path("cuts.json"), run(Media::Python.new.executable, File.join(Python::SCRIPTS, "cuts.py"), source, quiet: true))
      { beats: JSON.parse(File.read(path("beats.json"))), cuts: JSON.parse(File.read(path("cuts.json"))) }
    end

    def build
      run("swift", "build", "-c", "release", "--package-path", PACKAGE)
      BIN
    end

    # cues.yml -> output/<name>/cues.json (checked: known fx, integer f/dur, sorted by frame).
    def cues
      list = config.fetch("cues").map do |c|
        fx = c.fetch("fx")
        raise ArgumentError, "unknown fx #{fx.inspect} in #{c} (#{(CORE_IMAGE + LIGHTS).join(" ")})" unless (CORE_IMAGE + LIGHTS).include?(fx)
        raise ArgumentError, "cue needs integer f and dur: #{c}" unless c["f"].is_a?(Integer) && c["dur"].is_a?(Integer) && c["dur"].positive?
        c
      end.sort_by { |c| [c["f"], c["fx"]] }
      File.write(path("cues.json"), JSON.pretty_generate({ "cues" => list }))
      path("cues.json")
    end

    # Frames any light cue touches (clipped to the video), optionally only those in `among`.
    def light_frames(among = nil)
      total = frames
      set = JSON.parse(File.read(path("cues.json")))["cues"].select { |c| LIGHTS.include?(c["fx"]) }
                .flat_map { |c| ((c["f"] - c["pre"].to_i)...(c["f"] + c["dur"])).to_a }.select { |f| f >= 0 && f < total }.uniq.sort
      among ? set & among : set
    end

    # The p5 light layer for `only` frames (default: every frame a light cue touches) -> output/<name>/lights/NNNN.png.
    # Old light frames (all, or the `only` ones) are removed first, so a moved cue never leaves light behind.
    def lights(only = nil)
      frames_to_draw = light_frames(only)
      only ? FileUtils.rm_f(only.map { |f| path(format("lights/%04d.png", f)) }) : FileUtils.rm_rf(path("lights"))
      return path("lights") if frames_to_draw.empty?
      v = FFmpeg.new.summary(source)[:video]
      Anim.new.render(sketch, path("lights"), width: v[:w], height: v[:h], fps: 24, frames: frames, data: { vfx: path("cues.json") },
                                              only: frames_to_draw)
      path("lights")
    end

    # Stills of `list` frames with every effect -> output/<name>/stills/NNNN.png and a contact sheet stills.jpg (labelled by frame).
    def stills(list)
      cues
      lights(list)
      FileUtils.rm_rf(path("stills"))
      mvfx("--stills", path("stills"), "--only", list.join(","))
      pngs = list.sort.map { |f| path(format("stills/%04d.png", f)) }
      run("magick", "montage", *(["-font", FONT] if FONT), "-pointsize", "20", "-fill", "white", "-label", "%t", *pngs,
          "-tile", "4x", "-geometry", "640x358+4+4", "-background", "black", path("stills.jpg"))
      path("stills.jpg")
    end

    # Frames [from, to) with the song, as its own video -> output/<name>/clip_<from>_<to>.mp4.
    def clip(from, to)
      cues
      lights((from...to).to_a)
      mvfx("--out", path("clip_#{from}_#{to}.mp4"), "--from", from, "--to", to)
      path("clip_#{from}_#{to}.mp4")
    end

    # The whole video -> config `out` (the source's audio stream copied).
    def render
      cues
      lights
      mvfx("--out", out)
      out
    end

    def frames = @frames ||= FFmpeg.new.run("ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                                             "stream=nb_read_packets", "-of", "csv=p=0", source, quiet: true).to_i

    private

    def mvfx(*args)
      build if !File.exist?(BIN) || Dir[File.join(PACKAGE, "**", "*.swift")].any? { |f| File.mtime(f) > File.mtime(BIN) }
      JSON.parse(run(BIN, "--in", source, "--cues", path("cues.json"), "--lights", path("lights"), *args.map(&:to_s)).lines.last)
    end
  end
end
