require_relative "../workflow/approval"
require_relative "../workflow/waves"
require_relative "../workflow/journal"
require_relative "../pipeline/reference_importer"
module Toolkit
  class Operations
    TASKS = {
      "doctor" => "Check local tools; STRICT=1 fails on missing prerequisites",
      "setup" => "Install gems, npm packages and a local Python venv through Ruby",
      "openapi:fetch" => "Fetch current Fal input schemas (no generation)",
      "openapi:summary" => "Print saved Fal schema summaries",
      "plan:approve" => "Record actual user approval: NOTE='approved wording'",
      "work:next" => "Allocate/resume next dependency-ready wave; SIZE=2/3..4/4..8/6..10",
      "work:accept" => "Accept reviewed job: JOB=id EVIDENCE=review.md",
      "work:log" => "Append worker progress: AGENT=id EVENT=event MESSAGE=text; LOG_DIR optional",
      "work:watch" => "Show recent worker log entries; LOG_DIR and LIMIT optional",
      "pipeline:status" => "Show RUN's generated/reviewed steps",
      "pipeline:all" => "Generate and review all configured steps of RUN",
      "anim:render" => "Render sketch: [sketch,out,frames,width,height] (local)",
      "anim:preview" => "Preview RUN's overlay frames: [0,48,96] (local)",
      "anim:overlay" => "Render RUN's saved overlay data (local)",
      "anim:prepare" => "Prepare local overlay cues from optional full-song [words.json], without Fal",
      "audio:analyze" => "Decode and analyze song beats/energy: [audio,out_dir] (local)",
      "audio:transcribe" => "Word timestamps with Fal Whisper: [audio,out.json] (paid)",
      "media:stems" => "Fal Demucs: [audio,out_dir,vocals,...] (paid)",
      "media:probe" => "Probe [path]",
      "media:sheet" => "Contact sheet [video,out.jpg]",
      "media:frames" => "Dense reference analysis [video,out_dir,fps,width]",
      "media:frame" => "Extract [video,seconds,out.png]",
      "media:cut" => "Cut reference video [video,out.mp4,start,seconds]",
      "media:cuts" => "Detect picture cuts [video,out.json] (Python)",
      "media:mouth" => "Mouth alignment [clip_dir,vocals.wav,song_start,x,y,w,h] (Python)",
      "media:cutout" => "Cut out sprite [source,out_dir,green|paper] (Python)",
      "media:keep_component" => "Keep seeded alpha silhouette [source_dir,out_dir,seed_x,seed_y] (Python)",
      "media:sprite_box" => "Detect sprite bounds [source,green|paper] (Python)",
      "media:split_row" => "Split a character sheet [source,out_prefix,x1,x2,...] (Python)",
        "media:track" => "Track template [video,out.json,x,y,size,search,from_frame]",
        "media:audio_cut" => "Cut audio [source,out.wav,start,seconds]",
        "media:style" => "Style analysis [image,...] (Python)",
      "media:concat" => "Concatenate unrelated clips [out.mp4,a.mp4,b.mp4,...]",
      "media:mux" => "Replace audio [video,audio,out.mp4]",
      "media:preview" => "Join contiguous sections with unbroken song [out.mp4,s01,s02,...]",
      "media:youtube" => "4K delivery [video,out.mp4] (local encode only)",
      "media:twitter" => "1080p delivery [video,out.mp4] (local encode only)",
      "media:upload" => "Upload [path] to Fal CDN",
      "ref:import" => "Reuse existing hosted identity [new_run,local_image,original_manifest.json] (no upload)",
      "vfx:build" => "Build Swift Core Image renderer (macOS)",
      "vfx:analyze" => "Analyze VFX source beats and cuts; VFX=name",
      "vfx:stills" => "Preview cued VFX frames [0,24,...]; VFX=name",
      "vfx:clip" => "Render VFX interval [from_frame,to_frame]; VFX=name",
      "vfx:render" => "Render complete VFX version; VFX=name",
      "sfx:gen" => "Generate/cache Fal SFX or local tones; SFX=name (paid for Fal)",
      "sfx:mix" => "Mix cued SFX against music (local); SFX=name",
      "history" => "List archived attempts [step]",
      "adopt" => "Recover completed Fal request [step,request_id]",
      "pick" => "Restore archived request [step,index]",
      "import" => "Copy step from another run [step,source_run]",
      "test" => "Run RSpec suite; PROFILE=all|core|media|swift|live"
    }.freeze
    def ff = @ff ||= Media::FFmpeg.new
    def py = @py ||= Media::Python.new
    def emit(value) = puts(JSON.pretty_generate(value))
    def endpoints = Fal::Models.constants.filter_map { |c| k = Fal::Models.const_get(c); k.endpoint if k.respond_to?(:endpoint) && k != Fal::Models::Base }.uniq
    def required(args, n)
      raise ArgumentError, "Need #{n} arguments; see ruby scripts/mv.rb --help or rake -T" if args.size < n
      args
    end
    def call(name, a)
      case name
      when "doctor" then doctor
      when "setup" then setup
      when "openapi:fetch" then endpoints.each { |id| Fal::OpenAPI.fetch(id); warn "fetched #{id}" }
      when "openapi:summary" then endpoints.each { |id| puts Fal::OpenAPI.load(id).summary if File.file?(Fal::OpenAPI.spec_path(id)) }
      when "plan:approve" then emit Workflow::Approval.new.record!(ENV["NOTE"])
      when "work:next" then Workflow::Approval.new.check!; emit Workflow::Waves.new.next!(ENV["SIZE"])
      when "work:accept" then emit Workflow::Waves.new.accept!(ENV.fetch("JOB"), ENV["EVIDENCE"])
      when "work:log" then emit Workflow::Journal.new.append(agent: ENV["AGENT"], event: ENV["EVENT"], message: ENV["MESSAGE"], artifact: ENV["ARTIFACT"], request_id: ENV["REQUEST_ID"])
      when "work:watch" then emit Workflow::Journal.new.snapshot(limit: Integer(ENV.fetch("LIMIT", "5")))
      when "pipeline:status" then emit Pipeline::Project.new.manifest
      when "pipeline:all" then Pipeline::Project.new.steps.each { |s| generate(s); s.new.review! }
      when "anim:render"
        required(a, 3); emit Media::Anim.new.render(a[0], a[1], frames: Integer(a[2]), width: Integer(a[3] || 1920), height: Integer(a[4] || 1080), fps: 24)
      when "anim:preview" then required(a, 1); Pipeline::Steps::Overlay.new.preview!(a.map { |x| Integer(x) })
      when "anim:overlay" then emit Pipeline::Steps::Overlay.new.render!
      when "anim:prepare" then emit Pipeline::Steps::Overlay.new.prepare!(a[0])
      when "audio:analyze" then required(a, 2); analyze_audio(*a)
      when "audio:transcribe"
        required(a, 2); c = Fal::Client.new; result = Fal::Models::Whisper.new(client: c).transcribe(audio_url: c.upload(a[0]), chunk_level: "word")
        FileUtils.mkdir_p(File.dirname(a[1])); File.write(a[1], JSON.pretty_generate(result.output)); emit(path: a[1], request_id: result.request_id)
      when "media:stems"
        required(a, 2); c = Fal::Client.new; stems = a.drop(2); stems = %w[vocals] if stems.empty?
        result = Fal::Models::Demucs.new(client: c).separate(audio_url: c.upload(a[0]), stems: stems)
        FileUtils.mkdir_p(a[1]); emit stems.map { |s| c.download(result.output.fetch(s).fetch("url"), File.join(a[1], "#{s}.wav")) }
      when "media:probe" then required(a, 1); emit ff.summary(a[0])
      when "media:sheet" then required(a, 2); emit ff.contact_sheet(*a)
      when "media:frames" then required(a, 2); emit ff.extract_frames(a[0], a[1], fps: Float(a[2] || 12), width: Integer(a[3] || 480))
      when "media:frame" then required(a, 3); emit ff.frame_at(a[0], Float(a[1]), a[2])
      when "media:cut"
        required(a, 4); ff.run("ffmpeg", "-y", "-v", "error", "-ss", a[2], "-i", a[0], "-t", a[3], "-c:v", "libx264", "-c:a", "aac", a[1]); emit(path: a[1])
      when "media:cuts"
        required(a, 2); result = py.call("cuts.py", a[0]); File.write(a[1], JSON.pretty_generate(result)); emit(path: a[1], cuts: result["cuts"])
      when "media:mouth"
        required(a, 7); result = py.run(py.executable, File.join(Media::Python::SCRIPTS, "mouth_sync.py"), *a); emit JSON.parse(result.lines.last)
      when "media:cutout" then required(a, 3); emit py.cutout(*a)
      when "media:keep_component" then required(a, 4); emit Media::SpriteComponents.new.keep(*a)
      when "media:sprite_box" then required(a, 2); emit py.call("sprite_box.py", *a)
      when "media:split_row" then required(a, 3); emit(summary: py.run(py.executable, File.join(Media::Python::SCRIPTS, "split_row.py"), *a))
        when "media:track"
          required(a, 5); result = py.track_template(a[0], Integer(a[2]), Integer(a[3]), Integer(a[4]), Integer(a[5] || a[4]), Integer(a[6] || 0)); File.write(a[1], JSON.pretty_generate(result)); emit(path: a[1])
        when "media:audio_cut" then required(a, 4); emit ff.extract_audio(a[0], a[1], from: Float(a[2]), seconds: Float(a[3]))
        when "media:style" then required(a, 1); emit py.style_split(*a)
      when "media:concat" then required(a, 2); emit ff.concat_videos(a.drop(1), a[0])
      when "media:mux" then required(a, 3); emit ff.mux(*a, shortest: false)
      when "media:preview" then required(a, 2); emit preview(a[0], a.drop(1))
      when "media:youtube" then required(a, 2); emit ff.youtube_4k(*a)
      when "media:twitter" then required(a, 2); emit ff.twitter_1080(*a)
      when "media:upload" then required(a, 1); emit(url: Fal::Client.new.upload(a[0]))
      when "ref:import" then required(a, 3); emit Pipeline::ReferenceImporter.new.import(run: a[0], image: a[1], manifest: a[2])
      when "vfx:build" then emit Media::Vfx.new.build
      when "vfx:analyze" then emit Media::Vfx.new.analyze
      when "vfx:stills" then required(a, 1); emit Media::Vfx.new.stills(a.map { |x| Integer(x) })
      when "vfx:clip" then required(a, 2); emit Media::Vfx.new.clip(*a.map { |x| Integer(x) })
      when "vfx:render" then emit Media::Vfx.new.render
      when "sfx:gen" then emit Media::Sfx.new.generate(only: ENV["ONLY"]&.split(","), force: ENV["FORCE"] == "1")
      when "sfx:mix" then emit Media::Sfx.new.mix
      when "history" then required(a, 1); emit Array(Pipeline::Project.new[a[0]]&.dig("history"))
      when "adopt" then required(a, 2); step(a[0]).new.adopt!(a[1])
      when "pick" then required(a, 2); step(a[0]).new.pick!(Integer(a[1]))
      when "import" then required(a, 2); step(a[0]).new.import!(a[1])
      when "test" then require_relative "test_runner"; TestRunner.new.run
      else raise ArgumentError, "Unknown task #{name}"
      end
    end
    def step(key) = Pipeline::ALL_STEPS.find { |s| s.key.to_s == key } || raise("Unknown step #{key}")
    def generate(klass)
      project = Pipeline::Project.new
      raise "#{klass.key} is not configured for RUN=#{project.name}" unless project.steps.include?(klass)
      File.open(project.path("worker.lock"), File::CREAT | File::RDWR) do |lock|
        raise "RUN=#{project.name} already has a worker" unless lock.flock(File::LOCK_EX | File::LOCK_NB)
        klass.new(project: project).run!
      end
    end
    def analyze_audio(source, out)
      FileUtils.mkdir_p(out)
      wav = ff.extract_audio(source, File.join(out, "song.wav"))
      beats = py.call("beats.py", wav, "24")
      energy = py.audio_energy(wav)
      File.write(File.join(out, "beats.json"), JSON.pretty_generate(beats))
      File.write(File.join(out, "energy.json"), JSON.pretty_generate(energy))
      emit(duration: ff.duration(wav), bpm: beats["bpm"], beats: File.join(out, "beats.json"), energy: File.join(out, "energy.json"))
    end
    def preview(out, names)
      runs = names.map { |n| Pipeline::Project.new(n) }
      runs.each_cons(2) do |left, right|
        a, b = left.generation, right.generation
        raise "Noncontiguous song sections: #{left.name} -> #{right.name}" unless a[:music_from] == b[:music_from] && a[:music_offset] && (a[:music_offset] + left.duration - b[:music_offset].to_f).abs < 1e-6
      end
      runs.each do |r|
        actual = ff.summary(r.path("final_overlay.mp4")).dig(:video, :frames)
        raise "#{r.name}: #{actual} frames, expected #{(r.duration * 24).round}" unless actual == (r.duration * 24).round
      end
      FileUtils.mkdir_p(File.dirname(out))
      first = runs.first.generation
      song = ff.extract_audio(first.fetch(:music_from), "#{out}.song.wav", from: first.fetch(:music_offset), seconds: runs.sum(&:duration))
      video = ff.concat_videos(runs.map { |r| r.path("final_overlay.mp4") }, "#{out}.video.mp4", audio: false)
      ff.mux(video, song, out, shortest: false)
      FileUtils.rm_f([song, video])
      out
    end
    def doctor
      bins = %w[ffmpeg ffprobe magick python3 node swift]
      checks = bins.to_h { |b| [b, Media::Shell.available?(b)] }
      checks["python_packages"] = system(py.executable, "-c", "import PIL, numpy", out: File::NULL, err: File::NULL)
      checks["node_packages"] = File.directory?("node_modules/p5") && File.directory?("node_modules/puppeteer-core")
      checks["chrome"] = [ENV["CHROME_PATH"], "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].compact.any? { |p| File.file?(p) }
      checks["fal_key"] = !ENV["FAL_AI_API_KEY"].to_s.strip.empty?
      emit checks
      raise "Missing prerequisites; see references/testing.md and run setup" if ENV["STRICT"] == "1" && checks.values.any? { |v| !v }
    end
    def setup
      shell = Media::Shell.new
      shell.run(RbConfig.ruby, "-S", "bundle", "install")
      shell.run("npm", "ci")
      shell.run("python3", "-m", "venv", ".venv") unless File.directory?(".venv")
      shell.run(File.expand_path(".venv/bin/python3"), "-m", "pip", "install", "-r", "requirements.txt")
      doctor
    end
  end
end
