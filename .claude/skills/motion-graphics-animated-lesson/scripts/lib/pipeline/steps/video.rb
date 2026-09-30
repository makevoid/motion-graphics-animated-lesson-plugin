module Pipeline
  module Steps
    # Step 4 — animate the reference frame into a singing shot
    # (minimax/h3-max/image-to-video, project.duration seconds) with the song pinned as soundtrack, then mux
    # the clean master audio into the final deliverable. No lipsync pass (see tmp/old/).
    class Video < Step
      MODEL = Fal::Models::H3MaxImageToVideo

      # END_KEYFRAME=0 disables pinning the last frame to the reference
      # (without it H3 drifts away from the reference style, e.g. "heals" run1's torn paper).
      def submit
        ref = project.fetch!(source, :url)
        MODEL.new(client: client).animate(
          prompt: project.prompt("04_video"),
          image_url: ref,
          end_image_url: (ref unless ENV["END_KEYFRAME"] == "0"),
          target_audio_url: project.fetch!(:music, :url),
          duration: project.duration, seed: seed,
          resolution: ENV.fetch("VIDEO_RES", "1080P")
        )
      end

      def materialize(result)
        video = result.output.fetch("video")
        raw = download(video["url"], "04_video_raw.mp4")
        base_data(result).merge(
          url: video["url"], raw_path: raw, path: ffmpeg.mux(raw, project[:music]["path"], project.path("final.mp4")),
          source: source, expanded_prompt: result.output["expanded_prompt"], timings: result.output["timings"]
        )
      end

      def review
        final = project[key]["path"]
        summary = ffmpeg.summary(final)
        sheet = ffmpeg.contact_sheet(final, project.review_path(key, "contact_sheet.jpg"))
        frames = ffmpeg.extract_frames(final, project.review_path(key, "frames"), fps: 2)
        ref = python.style_split(project[source]["path"])["images"].first
        split = python.style_split(*frames)
        monos = split["images"].map { |i| i["mono_pct"] }
        sats = split["images"].map { |i| i["mean_saturation"] }
        drift = (monos.max - monos.min).round(1)
        mono_gap = (split["mean_mono_pct"] - ref["mono_pct"]).round(1)
        sat_gap = (sats.sum / sats.size - ref["mean_saturation"]).round(3)
        {
          summary: summary, contact_sheet: sheet,
          style: { ref_mono_pct: ref["mono_pct"], frame_mono_pct: monos, mean: split["mean_mono_pct"], drift: drift,
                   ref_saturation: ref["mean_saturation"], frame_saturation: sats },
          **verdict(
            "duration ~#{project.duration}s" => [(summary[:duration] - project.duration).abs < 0.6, "#{summary[:duration]}s"],
            "master audio muxed" => [summary.dig(:audio, :codec) == "aac" && summary.dig(:audio, :rate) == 44_100, summary[:audio].inspect],
            "resolution >= 720p" => [summary.dig(:video, :h).to_i >= 720, "#{summary.dig(:video, :w)}x#{summary.dig(:video, :h)}"],
            "reference style kept" => [mono_gap.abs <= [10, ref["mono_pct"] * 0.4].max, "frames #{split["mean_mono_pct"]}% mono vs ref #{ref["mono_pct"]}% (#{mono_gap}pp)"],
            "palette kept" => [sat_gap.abs < 0.08, "mean saturation #{sat_gap.positive? ? "+" : ""}#{sat_gap} vs ref #{ref["mean_saturation"]}"],
            "style stable" => [drift < 20, "mono drift #{drift}pp across frames"]
          )
        }
      end

      private

      # The frame H3 animates: run1's torn-paper collage, otherwise the base image.
      def source = project.step?(RefTorn) ? :ref_torn : :ref_base
    end
  end
end
