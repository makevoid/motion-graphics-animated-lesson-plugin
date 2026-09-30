module Pipeline
  module Steps
    # Step 4c — character sprites for a p5-animated section: each item is cut out of its background into a transparent PNG
    # sequence (output/<run>/04_clips/<name>/NNNN.png) that the overlay sketch loads with Anim.clip(name) and moves itself.
    # prompts/<run>/04_clips.yml lists the items; the source is one of
    #   image / end_image (+ prompt)  an H3 clip from keyframes (as in Shots); audio_at: <song seconds> pins the song from there,
    #                                 so sprite frame i lip-syncs to song time audio_at + i/24; seconds: 5..15 (default 5);
    #                                 audio: <path> drives the lip-sync with another full-song-aligned track instead of the mix (a vocal
    #                                 stem from `rake media:stems`, so the mouth rests in the singer's pauses), gate: <dB> silences it below
    #   source: <path>                an existing video in the repo
    #   still: <keyframe> | <run>/<keyframe> | run:<run>   a keyframe of this run or another, or another run's ref_base (a single frame)
    # and the cut-out options: key: paper | green (chroma background), box: [x, y, w, h] crop in source pixels,
    # seed: [x, y] a point on the character (paper key: only the part connected to it is kept), frames: how many (default all),
    # start: first frame, scale: resize factor. RECUT=1 ONLY=<name> FORCE=1 re-cuts a downloaded H3 clip without a fal call.
    class Clips < ItemsStep
      MODEL = Fal::Models::H3MaxImageToVideo
      FPS = 24

      def specs = @specs ||= yaml("04_clips").to_h { |clip| [clip.fetch("name"), clip] }

      def generate(name, spec)
        source, generated = source_for(name, spec)
        dir = project.path("04_clips", name)
        FileUtils.rm_rf(dir)
        cut = python.cutout(source, dir, spec.fetch("key", "paper"), **spec.slice("box", "seed", "frames", "start", "scale").transform_keys(&:to_sym))
        meta = cut.merge("dir" => dir.delete_prefix("#{ROOT}/"), "fps" => FPS, "audio_at" => spec["audio_at"], "source" => source)
        File.write(project.path("04_clips", "#{name}.json"), JSON.pretty_generate(meta))
        { path: project.path("04_clips", "#{name}.json"), source: source, frames: cut["frames"], **generated }
      end

      # Deliverable: a board of every sprite's first frame.
      def finish(items)
        pairs = items.map { |name, item| [File.join(ROOT, JSON.parse(File.read(item["path"]))["dir"], "0000.png"), "#{name} (#{item["frames"]}f)"] }
        { path: magick.board(pairs, project.path("04_clips.jpg"), tile: "4x", width: 480) }
      end

      def review
        items = project[key]["items"]
        coverage = items.to_h do |name, item|
          meta = JSON.parse(File.read(item["path"]))
          [name, (magick.alpha_coverage(File.join(ROOT, meta["dir"], "0000.png")) * 100).round(1)]
        end
        {
          board: project[key]["path"], coverage_pct: coverage,
          **verdict(coverage.to_h { |name, pct| ["#{name} cut out", [pct.between?(3, 90), "#{pct}% opaque, #{items[name]["frames"]} frames"]] })
        }
      end

      protected

      def endpoint = MODEL.endpoint

      private

      # [local file to cut out, manifest fields of the fal request when one was made]
      def source_for(name, spec)
        return [File.expand_path(spec["source"], ROOT), {}] if spec["source"]
        if (still = spec["still"])
          return [Project.new(still.delete_prefix("run:")).fetch!(:ref_base, :path), {}] if still.start_with?("run:")
          return [project.keyframe(still)["path"], {}]
        end
        # RECUT=1: cut the already-downloaded H3 clip again (new box/key/frames) instead of calling fal.
        prev = project[key]&.dig("items", name)
        if ENV["RECUT"] == "1" && prev&.dig("url") && File.exist?(local = project.path("04_clip_#{name}.mp4"))
          return [local, prev.slice("request_id", "input", "url").transform_keys(&:to_sym)]
        end
        seconds = spec.fetch("seconds", 5)
        audio = if spec["audio"] && spec["audio_at"] then stem_url(name, spec, seconds)
                elsif spec["audio_at"] then song_url(name, spec["audio_at"], seconds)
                end
        result = MODEL.new(client: client).animate(
          prompt: spec.fetch("prompt"), image_url: keyframe_url(spec.fetch("image")),
          end_image_url: spec["end_image"]&.then { |k| keyframe_url(k) }, target_audio_url: audio,
          duration: seconds, seed: seed, resolution: ENV.fetch("VIDEO_RES", "1080P")
        )
        url = result.output.fetch("video")["url"]
        [download(url, "04_clip_#{name}.mp4"), { request_id: result.request_id, input: result.input, url: url }]
      end

      # `seconds` of a full-song-aligned track (spec audio:) from this section's audio_at, as H3's target audio: the section's song offset
      # is added, and an optional gate (dB) turns the stem's bleed in the pauses into silence (H3 then closes the mouth there).
      def stem_url(name, spec, seconds)
        from = project.generation.fetch(:music_offset, 0) + spec["audio_at"]
        gate = spec["gate"] ? ["-af", "agate=threshold=#{10**(spec["gate"] / 20.0)}:ratio=9000:attack=1:release=40:range=0.001"] : []
        out = project.path("04_audio_#{name}.wav")
        ffmpeg.run("ffmpeg", "-y", "-v", "error", "-ss", from.round(4).to_s, "-i", File.expand_path(spec["audio"], ROOT), "-t", seconds.to_s,
                   *gate, "-ar", "44100", out)
        out = ffmpeg.fit_audio(out, project.path("04_audio_#{name}_padded.wav"), seconds: 2, fade: 0) if ffmpeg.duration(out) < 2
        client.upload(out)
      end
    end
  end
end
