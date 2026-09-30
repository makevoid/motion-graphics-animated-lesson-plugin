require_relative "spec_helper"
RSpec.describe "Local media end to end", :media do
  it "executes the documented intake and audio-analysis task in a fresh project" do
    song = tone(duration: 3)
    File.write(file("brief.md"), "A robot band, visual puns and dramatic drop")
    destination = file("new project")
    _, err, status = cli("init", "--project", destination, "--song", song, "--prompt-file", file("brief.md"))
    expect(status.exitstatus).to eq(0), err
    out, err, status = cli("--project", destination, "audio:analyze[audio/source.wav,audio]")
    expect(status.exitstatus).to eq(0), err
    expect(JSON.parse(out)["duration"]).to be_within(0.01).of(3)
    expect(File.file?(File.join(destination,"tools/python/beats.py"))).to be(true)
    expect(File.file?(File.join(destination,".skill/SKILL.md"))).to be(true)
    expect(File.directory?(File.join(destination,"node_modules"))).to be(false)
    expect(File.directory?(File.join(destination,"tools/vfx/.build"))).to be(false)
  end
  it "renders typography, timing and graphics helpers without bundled font files" do
    result = Media::Anim.new.render(File.join(RT,"tools/p5/examples/smoke.js"), file("smoke"), width: 1920, height: 1080, fps: 24, frames: 48, only: [0,24,47])
    expect(result["frames"]).to eq(3)
    expect(magick.alpha_coverage(file("smoke/0024.png"))).to be > 0.03
    expect(File.binread(file("smoke/0000.png"))).not_to eq(File.binread(file("smoke/0047.png")))
  end
  it "detects audio duration, a real silent tail and vocal-band energy through Python" do
    song = tone(duration: 4)
    Toolkit::Operations.new.analyze_audio(song, file("analysis"))
    energy = JSON.parse(File.read(file("analysis/energy.json")))
    expect(energy["duration"]).to be_within(0.02).of(4)
    expect(energy["silence_tail_s"]).to be >= 0.5
    expect(energy["windows"].first["vocal_ratio"]).to be > 0.9
    beats = JSON.parse(File.read(file("analysis/beats.json")))
    expect(beats.fetch("beats")).not_to be_empty
  end
  it "finds a hard cut at the expected frame through Python" do
    ff.run("ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "color=black:s=320x180:r=24:d=1", "-f", "lavfi", "-i", "color=white:s=320x180:r=24:d=1", "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0", "-c:v", "libx264", file("cuts.mp4"))
    data = py.call("cuts.py", file("cuts.mp4"))
    expect(data["cuts"].map { |c| c["f"] }).to include(24)
    expect(data["frames"]).to eq(48)
  end
  it "cuts out green, preserves the character and renders it at the intended p5 position" do
    meta = py.cutout(character, file("sprite"), "green")
    rgba = pixels(file("sprite/0000.png"))
    expect(rgba[0][3]).to eq(0)
    expect(rgba[90 * 320 + 160][3]).to be > 250
    meta["dir"] = file("sprite").delete_prefix("#{RT}/")
    json(file("clips.json"), hero: meta)
    File.write(file("scene.js"), <<~JS)
      Anim.sketch({
        async load() { this.hero = await Anim.clip('hero'); },
        draw(t, frame) { background('#102030'); this.hero.draw(this.hero.frame(0), 240, 90, 180); noStroke(); fill('#ffffff'); rect(8 + frame * 2, 8, 8, 8); }
      });
    JS
    renderer = Media::Anim.new
    renderer.render(file("scene.js"), file("frames"), width: 320, height: 180, fps: 24, frames: 24, data: {clips: file("clips.json")})
    png = pixels(file("frames/0000.png"))
    red = png.each_index.select { |i| r,g,b,_ = png[i]; r > 170 && g < 90 && b < 110 }
    xs = red.map { |i| i % 320 }; ys = red.map { |i| i / 320 }
    expect(xs.min).to be_within(3).of(208)
    expect(xs.max).to be_within(3).of(272)
    expect(ys.min).to be_within(3).of(36)
    expect(ys.max).to be_within(3).of(144)
    expect(Digest::SHA256.file(file("frames/0000.png")).hexdigest).not_to eq(Digest::SHA256.file(file("frames/0023.png")).hexdigest)
    renderer.render(file("scene.js"), file("repeat"), width: 320, height: 180, fps: 24, frames: 24, only: [0], data: {clips: file("clips.json")})
    expect(File.binread(file("repeat/0000.png"))).to eq(File.binread(file("frames/0000.png")))
    base = video(seconds: 1)
    ff.overlay_frames(base, file("frames"), file("scene.mp4"), fps: 24)
    info = ff.summary(file("scene.mp4"))
    expect(info.dig(:video, :frames)).to eq(24)
    expect(info.dig(:audio, :codec)).to eq("aac")
  end
  it "assembles contiguous sections without losing frames or the original soundtrack timing" do
    song = tone(duration: 2)
    runs = %w[e2e-join-a e2e-join-b]
    generations = runs.each_with_index.to_h { |name, i| [name, {steps: [], **Pipeline.section(i * 24, 24), music_from: song}] }
    stub_const("Pipeline::GENERATIONS", generations)
    runs.each do |run|
      project = Pipeline::Project.new(run)
      video(project.path("final_overlay.mp4"), audio: song, seconds: 1)
    end
    Toolkit::Operations.new.preview(file("joined.mp4"), runs)
    info = ff.summary(file("joined.mp4"))
    expect(info.dig(:video, :frames)).to eq(48)
    expect(info[:duration]).to be_within(0.06).of(2)
    original = ff.run("ffmpeg", "-v", "error", "-i", song, "-ac", "1", "-f", "s16le", "-", quiet: true).unpack("s<*")
    joined = ff.run("ffmpeg", "-v", "error", "-i", file("joined.mp4"), "-ac", "1", "-ar", "44100", "-f", "s16le", "-", quiet: true).unpack("s<*")
    size = [original.size, joined.size].min
    dot = original.take(size).zip(joined).sum { |x,y| x * y }
    norm = Math.sqrt(original.take(size).sum { |x| x*x } * joined.take(size).sum { |x| x*x })
    expect(dot / norm).to be > 0.98
  end
  it "mixes a timed sound effect, limits peaks and keeps the video frames" do
    source = video(seconds: 2)
    name = "e2e-sfx-#{Process.pid}"
    config_dir = File.join(RT, "prompts", name); FileUtils.mkdir_p(config_dir)
    File.write(File.join(config_dir, "sfx.yml"), YAML.dump({"source" => source, "out" => file("mixed.mp4"), "sounds" => {"beep" => {"tone" => 1200, "duration" => 0.3}}, "cues" => [{"sound" => "beep", "at" => 0.75, "rel_db" => -4}]}))
    service = Media::Sfx.new(name)
    service.generate(client: double("no Fal calls for tones"))
    out, report = service.mix
    expect(ff.summary(out).dig(:video, :frames)).to eq(48)
    expect(report).not_to be_empty
    dry = ff.run("ffmpeg", "-v", "error", "-i", source, "-ac", "1", "-ar", "48000", "-f", "s16le", "-", quiet: true).unpack("s<*")
    wet = ff.run("ffmpeg", "-v", "error", "-i", out, "-ac", "1", "-ar", "48000", "-f", "s16le", "-", quiet: true).unpack("s<*")
    expect(wet.map(&:abs).max).to be < 32767
    diff = ->(from, len) { wet.slice(from,len).zip(dry.slice(from,len)).sum { |a,b| (a-b).abs }.fdiv(len) }
    expect(diff.call(38_000, 5_000)).to be > diff.call(5_000, 5_000) * 3
  end
end
