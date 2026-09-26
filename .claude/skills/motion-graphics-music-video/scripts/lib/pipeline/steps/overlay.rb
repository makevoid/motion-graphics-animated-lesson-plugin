module Pipeline
  module Steps
    # Step 5 — motion-graphics overlay: the p5.js sketch prompts/<run>/05_overlay.js, rendered to a transparent
    # PNG sequence by anim/render.mjs and composited over the plate (video or shots step's final.mp4) -> final_overlay.mp4.
    # The sketch gets Whisper word timestamps of the song (Anim.data("words")) and, for every generation
    # `track: { name => [x, y, size, search, from_frame] }`, that feature's per-frame position (Anim.data(name)).
    # On a multi-shot plate it also gets the edit, Anim.data("shots") = [{ name, start_frame, frames }], to cut with the picture.
    # With a Clips step it gets the character sprites, Anim.data("clips") = { name => { dir, frames, w, h, audio_at, box, src } } (Anim.clip(name)),
    # and `plate: <keyframe>` (or "<run>/<keyframe>") in the generation makes the plate that keyframe held still (paper): the sketch animates everything else.
    class Overlay < Step
      MODEL = Fal::Models::Whisper
      OUT = "final_overlay.mp4".freeze

      def submit
        MODEL.new(client: client).transcribe(audio_url: project.fetch!(:music, :url), chunk_level: "word")
      end

      def materialize(result)
        words = Array(result.output["chunks"]).map { |c| { w: c["text"].to_s.strip, s: c.dig("timestamp", 0), e: c.dig("timestamp", 1) } }
        File.write(data_path(:words), JSON.pretty_generate(words))
        track!
        base_data(result).merge(render!)
      end

      # Reuse approved global word timings without another paid transcription.
      def prepare!(words_path = nil)
        raw = words_path ? JSON.parse(File.read(words_path)) : []
        chunks = raw.is_a?(Array) ? raw : raw.fetch("chunks") { raw.fetch("words", []) }
        offset = project.generation.fetch(:music_offset, 0)
        words = chunks.filter_map do |chunk|
          first = chunk["s"] || chunk.dig("timestamp", 0) || chunk["start"]
          last = chunk["e"] || chunk.dig("timestamp", 1) || chunk["end"]
          next unless first && last && last > offset && first < offset + project.duration
          { w: (chunk["w"] || chunk["text"] || chunk["word"]).to_s.strip,
            s: [first - offset, 0].max, e: [last - offset, project.duration].min }
        end
        File.write(data_path(:words), JSON.pretty_generate(words))
        track!
        { words: data_path(:words), count: words.size, local_offset: offset }
      end

      # Render all frames and composite, from the saved words.json / track files (no fal call): rake anim:overlay.
      def render!
        dir = project.path("05_overlay", "frames")
        FileUtils.rm_rf(dir)
        summary = anim.render(sketch, dir, **plate_format, data: data_files)
        path = ffmpeg.overlay_frames(plate, dir, project.path(OUT), fps: plate_format[:fps])
        data = { path: path, frames_dir: dir, sketch: sketch, render_ms: summary["ms"] }
        project.record(key, data.merge(review: nil))
        data
      end

      # Render only `frames` and composite each over its plate frame into one board: rake anim:preview[0,48,96].
      def preview!(frames)
        dir = project.path("05_overlay", "preview")
        anim.render(sketch, dir, **plate_format, data: data_files, only: frames)
        stills = frames.map do |i|
          [ffmpeg.overlay_still(plate, i, File.join(dir, format("%04d.png", i)), File.join(dir, format("still_%04d.jpg", i))),
           format("f%d  %.2fs", i, i.to_f / plate_format[:fps])]
        end
        magick.board(stills, project.review_path(key, "preview.jpg"), tile: "#{[stills.size, 3].min}x", width: 960).tap { |b| puts b }
      end

      def review
        final = project[key]["path"]
        summary = ffmpeg.summary(final)
        frames = Dir[File.join(project[key]["frames_dir"], "*.png")].sort
        coverage = frames.each_slice(6).map(&:first).to_h { |f| [File.basename(f, ".png").to_i, (magick.alpha_coverage(f) * 100).round(1)] }
        compare = ffmpeg.hstack(reference, final, project.review_path(key, "reference_vs_overlay.mp4")) if reference
        {
          summary: summary, contact_sheet: ffmpeg.contact_sheet(final, project.review_path(key, "contact_sheet.jpg"), cols: 6, rows: 3),
          coverage_pct_by_frame: coverage, compare: compare,
          **verdict(
            "same length as plate" => [(summary[:duration] - ffmpeg.duration(plate)).abs < 0.05, "#{summary[:duration]}s"],
            "every plate frame rendered" => [frames.size == plate_format[:frames], "#{frames.size}/#{plate_format[:frames]} png"],
            "audio kept" => [summary.dig(:audio, :codec) == "aac", summary[:audio].inspect],
            "overlay present" => [coverage.values.count(&:positive?) >= coverage.size * 0.8, "#{coverage.values.count(&:positive?)}/#{coverage.size} sampled frames have graphics"],
            # a still plate is just paper: the sketch is the picture
            "plate not buried" => [still_plate? || coverage.values.max < 45, "max coverage #{coverage.values.max}%"]
          )
        }
      end

      protected

      def anim = @anim ||= Media::Anim.new

      private

      def sketch = project.prompt_path("05_overlay")
      # The video to draw on: a held keyframe (plate:), the multi-shot plate, or the single-shot video.
      def plate
        return project.fetch!(project.step?(Shots) ? :shots : :video, :path) unless still_plate?
        out = project.path("04_plate_still.mp4")
        return out if File.exist?(out)
        image = project.keyframe(project.generation[:plate])["path"]
        ffmpeg.still_plate(image, project.fetch!(:music, :path), out, seconds: project.duration, fps: Clips::FPS)
      end

      def still_plate? = !!project.generation[:plate]
      def reference = project.generation[:reference]&.then { |f| File.join(ROOT, f) }
      def data_path(name) = project.path("05_overlay", "#{name}.json")
      def tracks = project.generation.fetch(:track, {})

      def data_files
        files = { words: data_path(:words), **tracks.keys.to_h { |name| [name, data_path(name)] } }
        if project.step?(Clips)
          clips = project.fetch!(:clips, :items).transform_values { |item| JSON.parse(File.read(item["path"])).slice("dir", "frames", "w", "h", "audio_at", "box", "src") }
          File.write(data_path(:clips), JSON.pretty_generate(clips))
          files[:clips] = data_path(:clips)
        end
        return files unless project.step?(Shots)
        shots = Shots.new(project: project).specs.map { |name, s| { name: name, start_frame: s["start_frame"], frames: s["frames"] } }
        File.write(data_path(:shots), JSON.pretty_generate(shots))
        files.merge(shots: data_path(:shots))
      end

      def track!
        tracks.each do |name, (x, y, size, search, from)|
          File.write(data_path(name), JSON.generate(python.track_template(plate, x, y, size, search || size, from || 0)))
        end
      end

      def plate_format
        @plate_format ||= ffmpeg.summary(plate).then do |s|
          { width: s.dig(:video, :w), height: s.dig(:video, :h), fps: s.dig(:video, :fps),
            frames: s.dig(:video, :frames) || (s[:duration] * s.dig(:video, :fps)).round }
        end
      end
    end
  end
end
