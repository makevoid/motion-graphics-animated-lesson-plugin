require "json"
require_relative "shell"

module Media
  # ffmpeg / ffprobe wrapper for probing, review sheets and audio/video assembly.
  class FFmpeg < Shell
    def probe(path)
      JSON.parse(run("ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", path, quiet: true))
    end

    def duration(path)
      probe(path).dig("format", "duration").to_f
    end

    # Compact stream summary: { duration:, video: {w,h,fps,codec}, audio: {codec,rate,channels} }
    def summary(path)
      info = probe(path)
      v = info["streams"].find { |s| s["codec_type"] == "video" }
      a = info["streams"].find { |s| s["codec_type"] == "audio" }
      {
        duration: info.dig("format", "duration").to_f.round(3),
        size_mb: (info.dig("format", "size").to_f / 1_048_576).round(2),
        video: v && { codec: v["codec_name"], w: v["width"], h: v["height"], fps: fps(v["avg_frame_rate"]), frames: v["nb_frames"]&.to_i },
        audio: a && { codec: a["codec_name"], rate: a["sample_rate"].to_i, channels: a["channels"] }
      }.compact
    end

    # Grid of evenly spaced frames (default 5x2 = 10 frames) for visual review.
    def contact_sheet(video, out, cols: 5, rows: 2, width: 384)
      FileUtils.mkdir_p(File.dirname(out))
      n = cols * rows
      rate = n / duration(video)
      label = filter?("drawtext") ? ",drawtext=fontfile='#{FONT}':text='%{pts\\:hms}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6" : ""
      run("ffmpeg", "-y", "-v", "error", "-i", video,
          "-vf", "fps=#{rate},scale=#{width}:-2#{label},tile=#{cols}x#{rows}:padding=4",
          "-frames:v", "1", out)
      out
    end

    # Whether this ffmpeg build has a filter (e.g. brew ffmpeg may lack drawtext/freetype).
    def filter?(name)
      @filters ||= run("ffmpeg", "-hide_banner", "-filters", quiet: true)
      @filters.match?(/^\s*\S+\s+#{Regexp.escape(name)}\s/)
    end

    # Dump frames at fps into dir (for python analysis).
    def extract_frames(video, dir, fps: 2, width: 512)
      FileUtils.mkdir_p(dir)
      run("ffmpeg", "-y", "-v", "error", "-i", video, "-vf", "fps=#{fps},scale=#{width}:-2", File.join(dir, "f_%03d.png"))
      Dir[File.join(dir, "f_*.png")].sort
    end

    def frame_at(video, seconds, out)
      FileUtils.mkdir_p(File.dirname(out))
      run("ffmpeg", "-y", "-v", "error", "-ss", seconds.to_s, "-i", video, "-frames:v", "1", out)
      out
    end

    # Close-up crop sequence of a region (e.g. the mouth) for lipsync review.
    def crop_strip(video, out, crop:, fps: 4, cols: 10, rows: 4)
      FileUtils.mkdir_p(File.dirname(out))
      run("ffmpeg", "-y", "-v", "error", "-i", video,
          "-vf", "fps=#{fps},crop=#{crop},scale=160:-2,tile=#{cols}x#{rows}:padding=2", "-frames:v", "1", out)
      out
    end

    def waveform(audio, out, size: "1600x300")
      run("ffmpeg", "-y", "-v", "error", "-i", audio, "-filter_complex", "showwavespic=s=#{size}:split_channels=0:colors=0x33ccff", "-frames:v", "1", out)
      out
    end

    def spectrogram(audio, out, size: "1600x512")
      run("ffmpeg", "-y", "-v", "error", "-i", audio, "-lavfi", "showspectrumpic=s=#{size}:legend=1:scale=log", out)
      out
    end

    def to_wav(audio, out, rate: 22_050)
      run("ffmpeg", "-y", "-v", "error", "-i", audio, "-ac", "1", "-ar", rate.to_s, out)
      out
    end

    # `seconds` of audio starting at `from` (shorter if the source ends first), 44.1k mp3.
    def cut_audio(audio, out, from:, seconds:)
      run("ffmpeg", "-y", "-v", "error", "-ss", from.round(3).to_s, "-i", audio, "-t", seconds.to_s, "-ar", "44100", "-b:a", "320k", out)
      out
    end

    # First audio stream of a video/audio file as 44.1k stereo wav (full quality, unlike to_wav),
    # optionally only `seconds` of it starting at `from`.
    def extract_audio(media, out, from: 0, seconds: nil)
      window = (from.positive? ? ["-ss", from.to_s] : [])
      length = seconds ? ["-t", seconds.to_s] : []
      run("ffmpeg", "-y", "-v", "error", *window, "-i", media, *length, "-vn", "-map", "0:a:0", "-ac", "2", "-ar", "44100", out)
      out
    end

    # Pad (with silence) or trim audio to exactly `seconds`, with a short fade-out (fade: 0 for none).
    def fit_audio(audio, out, seconds:, fade: 0.4)
      run("ffmpeg", "-y", "-v", "error", "-i", audio,
          "-af", "apad=whole_dur=#{seconds}#{",afade=t=out:st=#{seconds - fade}:d=#{fade}" if fade.positive?}",
          "-t", seconds.to_s, "-ar", "44100", "-b:a", "320k", out)
      out
    end

    # Replace video's audio with `audio` (video stream copied). shortest: false keeps every video frame when the audio is
    # already cut to the video's length (media:preview): -shortest stops at an AAC packet boundary and dropped the last
    # 4 frames of the 3373-frame full-song preview.
    def mux(video, audio, out, shortest: true)
      run("ffmpeg", "-y", "-v", "error", "-i", video, "-i", audio,
          "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", *("-shortest" if shortest), out)
      out
    end

    # Composite a transparent PNG sequence (<dir>/0000.png…, e.g. from Media::Anim) over `video`, keeping its audio.
    def overlay_frames(video, dir, out, fps:)
      run("ffmpeg", "-y", "-v", "error", "-i", video, "-framerate", fps.to_s, "-i", File.join(dir, "%04d.png"),
          "-filter_complex", "[0:v][1:v]overlay=0:0:format=auto:eof_action=pass,format=yuv420p[v]",
          "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-c:a", "copy", out)
      out
    end

    # YouTube 4K master: scaled (lanczos) to fill 3840x2160 (1928x1076 is a hair wider than 16:9: 15px cropped per side, no bars),
    # converted from the BT.601 matrix our untagged encodes use (swscale's default) to BT.709 and tagged as such, so YouTube shows the
    # sketch colours. x264 high@5.1, closed 12-frame GOPs (half the frame rate, as YouTube asks), faststart; the audio is copied.
    def youtube_4k(video, out, crf: 16)
      scale = "scale=3870:2160:flags=lanczos+accurate_rnd+full_chroma_int:in_color_matrix=bt601:out_color_matrix=bt709:" \
              "in_range=tv:out_range=tv,crop=3840:2160,setsar=1,format=yuv420p"
      run("ffmpeg", "-y", "-v", "error", "-i", video, "-vf", scale, "-c:v", "libx264", "-preset", "slow", "-crf", crf.to_s,
          "-profile:v", "high", "-level:v", "5.1", "-tune", "animation", "-g", "12", "-bf", "2", "-flags", "+cgop",
          "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
          # libx264 only wrote the matrix from the flags above; this writes primaries + transfer into the stream too
          "-bsf:v", "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0",
          "-c:a", "copy", "-movflags", "+faststart", out)
      out
    end

    # Twitter/X upload: the same fill-crop and BT.601 -> BT.709 conversion as youtube_4k, at 1920x1080 (1928x1076 -> 1935x1080, 7-8px
    # cropped per side). x264 high@4.2, CRF capped at ~13 Mbps (X re-encodes; a clean, not huge, source survives best), 1s GOPs,
    # faststart; the audio is copied.
    def twitter_1080(video, out, crf: 17, maxrate: "13M")
      scale = "scale=1935:1080:flags=lanczos+accurate_rnd+full_chroma_int:in_color_matrix=bt601:out_color_matrix=bt709:" \
              "in_range=tv:out_range=tv,crop=1920:1080,setsar=1,format=yuv420p"
      run("ffmpeg", "-y", "-v", "error", "-i", video, "-vf", scale, "-c:v", "libx264", "-preset", "slow", "-crf", crf.to_s,
          "-maxrate", maxrate, "-bufsize", "26M", "-profile:v", "high", "-level:v", "4.2", "-tune", "animation", "-g", "24", "-bf", "2",
          "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
          "-bsf:v", "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0",
          "-c:a", "copy", "-movflags", "+faststart", out)
      out
    end

    # Frame number n of `video` as a still.
    def frame_index(video, n, out)
      FileUtils.mkdir_p(File.dirname(out))
      run("ffmpeg", "-y", "-v", "error", "-i", video, "-vf", "select=eq(n\\,#{n})", "-frames:v", "1", out, quiet: true)
      out
    end

    # Cut and join shots into one silent video at `fps`, sized like the first shot. segments: [{ path:, frames:,
    # skip: (source frames to drop first), retime: (squeeze the whole source into `frames`) }].
    def concat_shots(segments, out, fps:)
      first = summary(segments.first[:path])[:video]
      size = "scale=#{first[:w]}:#{first[:h]},setsar=1"
      chains = segments.each_with_index.map do |seg, i|
        timing = if seg[:retime]
                   "setpts=(PTS-STARTPTS)*#{(seg[:frames].fdiv(fps) / duration(seg[:path])).round(6)},fps=#{fps},trim=end_frame=#{seg[:frames]}"
                 else
                   "fps=#{fps},trim=start_frame=#{seg[:skip].to_i}:end_frame=#{seg[:skip].to_i + seg[:frames]}"
                 end
        "[#{i}:v]#{timing},setpts=PTS-STARTPTS,#{size}[v#{i}]"
      end
      graph = "#{chains.join(";")};#{segments.size.times.map { |i| "[v#{i}]" }.join}concat=n=#{segments.size}:v=1:a=0,format=yuv420p[v]"
      run("ffmpeg", "-y", "-v", "error", *segments.flat_map { |s| ["-i", s[:path]] },
          "-filter_complex", graph, "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "14", "-preset", "medium", "-r", fps.to_s, out)
      out
    end

    # Join finished clips (video + audio) end to end, e.g. one generation per song section -> a long-form video.
    # Every clip is scaled/padded to the first clip's size and resampled to `fps`. audio: false joins the pictures only (for a
    # song laid over afterwards): with audio, concat starts each clip where the previous clip's AAC audio ends, a hair past its
    # video, and over four joins that skipped a whole frame (anim1..5 preview: 940 frames -> a gap at 800, 937 after the mux).
    def concat_videos(clips, out, fps: 24, audio: true)
      first = summary(clips.first)[:video]
      fit = "scale=#{first[:w]}:#{first[:h]}:force_original_aspect_ratio=decrease,pad=#{first[:w]}:#{first[:h]}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=#{fps},format=yuv420p"
      chains = clips.each_index.map { |i| "[#{i}:v]#{fit}[v#{i}]#{";[#{i}:a]aresample=44100,aformat=channel_layouts=stereo[a#{i}]" if audio}" }
      inputs = clips.each_index.map { |i| audio ? "[v#{i}][a#{i}]" : "[v#{i}]" }.join
      graph = "#{chains.join(";")};#{inputs}concat=n=#{clips.size}:v=1:a=#{audio ? 1 : 0}[v]#{"[a]" if audio}"
      codecs = audio ? ["-map", "[a]", "-c:a", "aac", "-b:a", "256k"] : ["-an"]
      run("ffmpeg", "-y", "-v", "error", *clips.flat_map { |c| ["-i", c] }, "-filter_complex", graph,
          "-map", "[v]", "-c:v", "libx264", "-crf", "16", "-preset", "medium", *codecs, out)
      out
    end

    # A still image held for `seconds` at `fps`, scaled to w×h, with `audio` muxed in (a plate for a sketch that animates everything).
    def still_plate(image, audio, out, seconds:, fps: 24, w: 1920, h: 1080)
      run("ffmpeg", "-y", "-v", "error", "-loop", "1", "-framerate", fps.to_s, "-i", image, "-i", audio,
          "-vf", "scale=#{w}:#{h},setsar=1,format=yuv420p", "-frames:v", (seconds * fps).round.to_s,
          "-c:v", "libx264", "-crf", "14", "-preset", "medium", "-c:a", "aac", "-b:a", "256k", "-t", seconds.to_s, out)
      out
    end

    # One frame (by index) of `video` with a transparent PNG composited on top, as a still.
    def overlay_still(video, frame, png, out)
      run("ffmpeg", "-y", "-v", "error", "-i", video, "-i", png,
          "-filter_complex", "[0:v]select=eq(n\\,#{frame})[b];[b][1:v]overlay=0:0", "-frames:v", "1", out, quiet: true)
      out
    end

    # Side-by-side comparison video (e.g. raw vs lipsynced), audio from `right`.
    def hstack(left, right, out, height: 540)
      run("ffmpeg", "-y", "-v", "error", "-i", left, "-i", right,
          "-filter_complex", "[0:v]scale=-2:#{height}[l];[1:v]scale=-2:#{height}[r];[l][r]hstack=inputs=2[v]",
          "-map", "[v]", "-map", "1:a?", "-c:v", "libx264", "-crf", "20", "-c:a", "aac", "-shortest", out)
      out
    end

    private

    def fps(rate)
      num, den = rate.to_s.split("/").map(&:to_f)
      den && den.positive? ? (num / den).round(2) : num
    end
  end
end
