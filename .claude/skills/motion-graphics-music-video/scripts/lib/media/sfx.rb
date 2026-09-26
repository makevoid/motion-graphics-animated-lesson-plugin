require "json"
require "yaml"
require "fileutils"
require_relative "shell"
require_relative "ffmpeg"

module Media
  # Sound effects over a finished video (the full-song preview). prompts/<name>/sfx.yml has
  #   source: / out:          the video to add sounds to (only read) and the new file
  #   rel_db:                 default level of a cue, in dB relative to the music's loudness under it (−4 ≈ clearly audible, still under it)
#   peak_db / max_gain_db:  caps: a cue never peaks above peak_db (−6) nor gets boosted more than max_gain_db (+18)
  #   sounds: { name => { prompt:, duration:, seed:, negative: } }   generated with fal stable-audio-3 SFX (Fal::Models::StableAudioSfx),
  #           or { tone: Hz, duration: }: a steady sine synthesized with ffmpeg (a monitor flatline; the model only makes rhythmic beeps)
  #   cues:   [{ at: song s, sound:, rel_db:, rate: (pitch/speed), len: (s, cut + fade), fade: (s) }, ...]
  # Sounds are cached in output/<name>/sounds/<sound>.wav with a sidecar json; a sound is generated again only when its prompt,
  # duration or seed changed (or FORCE=1 with ONLY=a,b). scripts/sfx_mix.py trims their leading silence, sets each cue's level
  # against the music in its window and limits the sum; the video stream is copied untouched.
  class Sfx < Shell
    ROOT = File.expand_path("../..", __dir__)

    attr_reader :name, :dir

    def initialize(name = ENV.fetch("SFX", "mv2-sfx"))
      @name = name
      @dir = File.join(ROOT, "output", name)
      FileUtils.mkdir_p(File.join(@dir, "sounds"))
    end

    def config = @config ||= YAML.safe_load_file(File.join(ROOT, "prompts", name, "sfx.yml"))
    def source = File.expand_path(config.fetch("source"), ROOT)
    def out = File.expand_path(config.fetch("out"), ROOT)
    def sounds = config.fetch("sounds")
    def wav(sound) = File.join(dir, "sounds", "#{sound}.wav")

    # Generate every sound that is missing or stale. only: names to force (with force: true).
    def generate(only: nil, force: false, client: nil)
      unknown = config.fetch("cues").map { |c| c.fetch("sound") }.uniq - sounds.keys
      raise "cues use undefined sounds: #{unknown.join(", ")}" if unknown.any?
      model = nil
      sounds.filter_map do |sound, spec|
        want = if spec["tone"]
                 { "tone" => spec["tone"], "duration" => spec.fetch("duration", 2) }
               else
                 { "prompt" => spec.fetch("prompt"), "duration" => spec.fetch("duration", 2), "seed" => spec["seed"],
                   "negative_prompt" => spec["negative"] || config["negative"] }
               end
        meta = File.join(dir, "sounds", "#{sound}.json")
        have = File.exist?(meta) && File.exist?(wav(sound)) ? JSON.parse(File.read(meta)) : {}
        stale = have.slice(*want.keys) != want
        next unless stale || (force && (only.nil? || only.include?(sound)))
        if spec["tone"]
          # A steady sine (e.g. a monitor flatline, which the SFX model always turns into rhythmic beeps): synthesized, no fal call.
          run("ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=#{want["tone"]}:sample_rate=48000:duration=#{want["duration"]}",
              "-af", "volume=-6dB,afade=t=in:d=0.004,afade=t=out:st=#{want["duration"] - 0.02}:d=0.02", "-ac", "2", wav(sound))
          File.write(meta, JSON.pretty_generate(want))
          next sound
        end
        warn "[sfx] #{sound} generating…"
        client ||= Fal::Client.new
        model ||= Fal::Models::StableAudioSfx.new(client: client)
        res = model.generate(prompt: want["prompt"], duration: want["duration"], seed: want["seed"],
                             negative_prompt: want["negative_prompt"], output_format: "wav")
        client.download(res.output.dig("audio", "url"), wav(sound))
        File.write(meta, JSON.pretty_generate(want.merge("request_id" => res.request_id, "used_seed" => res.output["seed"],
                                                         "url" => res.output.dig("audio", "url"))))
        sound
      end
    end

    # Mix the cues over the source video's audio -> out (video copied). Returns [out, per-cue level report].
    def mix
      missing = config.fetch("cues").map { |c| c["sound"] }.uniq.reject { |s| File.exist?(wav(s)) }
      raise "sounds not generated yet (rake sfx:gen): #{missing.join(", ")}" if missing.any?
      cues = config.fetch("cues").map do |c|
        { "at" => c.fetch("at"), "wav" => wav(c.fetch("sound")), "sound" => c["sound"], "rel_db" => c.fetch("rel_db", config.fetch("rel_db", -4)),
          "rate" => c.fetch("rate", 1.0), "len" => c["len"], "fade" => c.fetch("fade", 0.05) }
      end
      File.write(path("cues.json"), JSON.pretty_generate(cues))
      music = path("music.wav")
      run("ffmpeg", "-y", "-v", "error", "-i", source, "-vn", "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", music)
      report = JSON.parse(run(Media::Python.new.executable, File.join(ROOT, "tools", "python", "sfx_mix.py"), music, path("cues.json"), path("mix.wav"),
                              "--floor-db", config.fetch("floor_db", -30).to_s, "--peak-db", config.fetch("peak_db", -6).to_s,
                              "--max-gain-db", config.fetch("max_gain_db", 18).to_s, quiet: true))
      FFmpeg.new.mux(source, path("mix.wav"), out)
      [out, report]
    end

    def path(file) = File.join(dir, file)
  end
end
