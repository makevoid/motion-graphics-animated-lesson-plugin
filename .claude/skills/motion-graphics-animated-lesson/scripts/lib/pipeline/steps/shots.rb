module Pipeline
  module Steps
    # Step 4b — a multi-shot plate. prompts/<run>/04_shots.yml lists the shots in edit order, each `frames` long:
    #   image / end_image  keyframe names (Keyframes step) or "ref_base" -> H3 start / end frame
    #   audio: true        H3 gets the song from this shot's position in the edit, so the mouth follows the vocal
    #   seconds: 5..15     H3 generation length (default 5, H3's minimum); a shot uses its first `frames`, so frames <= seconds * 24
    #   retime: true       the whole H3 clip is squeezed into `frames` (fast camera moves)
    #   from_run: <run>    no generation: that run's video (same song timeline) from this shot's position
    # The shots are cut, concatenated and muxed with the master song -> final.mp4 (the plate Overlay draws on).
    class Shots < ItemsStep
      MODEL = Fal::Models::H3MaxImageToVideo
      FPS = 24
      GEN_SECONDS = 5 # default H3 length per shot (its minimum; max 15)

      def specs
        @specs ||= begin
          at = 0
          shots = yaml("04_shots")
          raise ArgumentError, "Shot frames must sum to section frames" unless shots.sum { |shot| shot.fetch("frames") } == (project.duration * FPS).round
          shots.to_h do |shot|
            spec = shot.merge("start_frame" => at)
            at += shot.fetch("frames")
            [shot.fetch("name"), spec]
          end
        end
      end

      def generate(name, spec)
        if (run = spec["from_run"])
          return { source: run, path: Project.new(run).fetch!(:video, :path) }
        end
        raise ArgumentError, "Never retime a singing shot" if spec["audio"] && spec["retime"]
        seconds = spec.fetch("seconds", GEN_SECONDS)
        raise ArgumentError, "shot needs more source frames" if !spec["retime"] && spec["frames"] > seconds * FPS
        audio = song_url(name, spec["start_frame"].fdiv(FPS), seconds) if spec["audio"]
        result = MODEL.new(client: client).animate(
          prompt: spec.fetch("prompt"), image_url: keyframe_url(spec.fetch("image")),
          end_image_url: spec["end_image"]&.then { |k| keyframe_url(k) }, target_audio_url: audio,
          duration: seconds, seed: seed, resolution: ENV.fetch("VIDEO_RES", "1080P")
        )
        url = result.output.fetch("video")["url"]
        { request_id: result.request_id, input: result.input, url: url, path: download(url, "04_shot_#{name}.mp4") }
      end

      def finish(items)
        segments = specs.map do |name, spec|
          { path: items[name]["path"], frames: spec["frames"], retime: spec["retime"],
            skip: spec["from_run"] ? spec["start_frame"] : 0 }
        end
        plate = ffmpeg.concat_shots(segments, project.path("04_plate.mp4"), fps: FPS)
        { path: ffmpeg.mux(plate, project[:music]["path"], project.path("final.mp4"), shortest: false), plate: plate }
      end

      def review
        final = project[key]["path"]
        summary = ffmpeg.summary(final)
        frames = summary.dig(:video, :frames)
        want = specs.values.sum { |s| s["frames"] }
        cuts = specs.flat_map do |name, s|
          [[s["start_frame"], "#{name} first"], [s["start_frame"] + s["frames"] - 1, "#{name} last"]].map do |n, label|
            [ffmpeg.frame_index(final, n, project.review_path(key, "f#{n}.jpg")), "f#{n} #{label}"]
          end
        end
        # Frames each source must have: from_run sources are read from the shot's position, generated ones from 0.
        short = specs.reject do |name, s|
          s["retime"] || ffmpeg.summary(project[key]["items"][name]["path"]).dig(:video, :frames).to_i >= (s["from_run"] ? s["start_frame"] : 0) + s["frames"]
        end
        {
          summary: summary, contact_sheet: ffmpeg.contact_sheet(final, project.review_path(key, "contact_sheet.jpg"), cols: 6, rows: 3),
          cuts: magick.board(cuts, project.review_path(key, "cuts.jpg"), tile: "2x", width: 640),
          **verdict(
            "frames = shots total" => [frames == want, "#{frames}/#{want}"],
            "duration ~#{project.duration}s" => [(summary[:duration] - project.duration).abs < 0.1, "#{summary[:duration]}s"],
            "master audio muxed" => [summary.dig(:audio, :codec) == "aac", summary[:audio].inspect],
            "every shot long enough" => [short.empty?, short.empty? ? "ok" : "too short: #{short.keys.join(", ")}"]
          )
        }
      end

      protected

      def endpoint = MODEL.endpoint
    end
  end
end
