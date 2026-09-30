require "json"
require "yaml"
require "fileutils"
require_relative "shell"
require_relative "ffmpeg"

module Media
  # Background music beds under a narrated video. prompts/<name>/music.yml (name = SFX env, default finish-music) has
  #   source: / out:          the video whose audio is the narration master (only read) and the new file (video stream copied)
  #   voice:                  the narration used as the ducking sidechain (default: the source's own audio)
  #   base_db:                bed loudness (RMS dBFS of the looped track) while nobody speaks
  #   duck_db:                extra attenuation while the voice is active (sidechain: fast attack, slow release, look-ahead)
  #   loop_xf / join_xf:      crossfade (s) at a track's loop point / between segments
  #   end:                    song second where the bed stops dead (e.g. on the final stamp)
  #   tracks:   { name => { prompt:, seconds: 60, gain_db: 0 } }   generated with ElevenLabs Music v2.5 (instrumental), cached in
  #             output/<name>/tracks/<track>.{mp3,wav,json}; a track is generated again only when its prompt/seconds changed (or FORCE=1)
  #   segments: [{ from:, to:, track:, gain_db:, duck: true, fade_in:, fade_out:, restart:, tape_stop:, tape_start: }]  song seconds; a recurring track continues
  #             where it left off; each track loops (with loop_xf) as long as its segments need.
  # tools/python/music_bed.py builds the bed, ducks it under the voice, mixes and reports levels.
  class MusicBed < Shell
    ROOT = File.expand_path("../..", __dir__)

    attr_reader :name, :dir

    def initialize(name = ENV.fetch("SFX", "finish-music"))
      @name = name
      @dir = File.join(ROOT, "output", name)
      FileUtils.mkdir_p(File.join(@dir, "tracks"))
    end

    def config = @config ||= YAML.safe_load_file(File.join(ROOT, "prompts", name, "music.yml"))
    def source = File.expand_path(config.fetch("source"), ROOT)
    def out = File.expand_path(config.fetch("out"), ROOT)
    def tracks = config.fetch("tracks")
    def wav(track) = tracks.fetch(track)["file"] ? File.expand_path(tracks.fetch(track)["file"], ROOT) : File.join(dir, "tracks", "#{track}.wav")
    def path(file) = File.join(dir, file)

    # Generate every missing or stale track (paid). only: names to force (with force: true).
    def generate(only: nil, force: false, client: nil)
      unknown = config.fetch("segments").map { |s| s.fetch("track") }.uniq - tracks.keys
      raise "segments use undefined tracks: #{unknown.join(", ")}" if unknown.any?
      tracks.filter_map do |track, spec|
        next if only && !only.include?(track)
        if spec["file"]
          raise "Local music track missing: #{wav(track)}" unless File.file?(wav(track))
          next # Reuse the preserved bytes, even with FORCE; never call the provider for a local track.
        end
        want = { "prompt" => spec.fetch("prompt"), "seconds" => spec.fetch("seconds", 60) }
        meta = File.join(dir, "tracks", "#{track}.json")
        have = File.exist?(meta) && File.exist?(wav(track)) ? JSON.parse(File.read(meta)) : {}
        next unless have.slice(*want.keys) != want || (force && (only.nil? || only.include?(track)))
        warn "[music] #{track} generating…"
        client ||= Fal::Client.new
        res = Fal::Models::ElevenMusic.new(client: client).compose(prompt: want["prompt"], music_length_ms: (want["seconds"] * 1000).round)
        mp3 = File.join(dir, "tracks", "#{track}.mp3")
        client.download(res.output.dig("audio", "url"), mp3)
        run("ffmpeg", "-y", "-v", "error", "-i", mp3, "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", wav(track))
        File.write(meta, JSON.pretty_generate(want.merge("request_id" => res.request_id, "url" => res.output.dig("audio", "url"),
                                                         "duration" => FFmpeg.new.duration(wav(track)))))
        track
      end
    end

    # Bed + ducking + mix over the source's audio -> out. Returns [out, report].
    def mix
      raise "Write measured music segments before music:bed" if config.fetch("segments").empty?
      missing = config.fetch("segments").map { |s| s["track"] }.uniq.reject { |t| File.exist?(wav(t)) }
      raise "tracks not generated yet (rake music:gen): #{missing.join(", ")}" if missing.any?
      voice = path("voice.wav")
      run("ffmpeg", "-y", "-v", "error", "-i", config["voice"] ? File.expand_path(config["voice"], ROOT) : source,
          "-vn", "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", voice)
      spec = config.slice("base_db", "duck_db", "loop_xf", "join_xf", "end", "attack", "release", "hold", "lookahead", "voice_lo_db", "voice_hi_db", "peak_db")
                   .merge("duration" => FFmpeg.new.duration(source),
                          "tracks" => tracks.to_h { |t, s| [t, { "wav" => wav(t), "gain_db" => s.fetch("gain_db", 0) }] },
                          "segments" => config.fetch("segments"))
      File.write(path("bed.json"), JSON.pretty_generate(spec))
      report = JSON.parse(run(Media::Python.new.executable, File.join(ROOT, "tools", "python", "music_bed.py"), voice, path("bed.json"),
                              path("bed.wav"), path("mix.wav"), quiet: true))
      FFmpeg.new.mux(source, path("mix.wav"), out)
      File.write(path("report.json"), JSON.pretty_generate(report))
      [out, report]
    end
  end
end
