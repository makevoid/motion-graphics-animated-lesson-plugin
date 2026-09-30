require_relative "spec_helper"
require_relative "../lib/toolkit/initializer"
require_relative "../lib/toolkit/mcp_server"

RSpec.describe "Portable lesson workflow", :core do
  it "initializes from a brief alone with preserved identities, voices, fonts, layout references and original music" do
    File.write(file("brief.md"), "Explain database indexes with a worked example")
    project = file("lesson")
    Toolkit::Initializer.new(RT).create(project: project, prompt: file("brief.md"))
    expect(File.exist?(File.join(project, "audio/source.wav"))).to be(false)
    cast = JSON.parse(File.read(File.join(project, "config/cast.json")))
    expect(cast["prof"].values_at("voice", "stability", "seed")).to eq(["George", 0.45, 11])
    expect(cast["dev"].values_at("voice", "stability", "seed")).to eq(["Liam", 0.5, 41])
    manifest = JSON.parse(File.read(File.join(project, ".skill/assets/lesson/manifest.json")))
    manifest.fetch("files").each do |entry|
      expect(Digest::SHA256.file(File.join(project, ".skill/assets/lesson", entry["path"])).hexdigest).to eq(entry["sha256"])
    end
    music = YAML.safe_load_file(File.join(project, "prompts/finish-music/music.yml"))
    expect(music["tracks"].keys).to contain_exactly("intro", "class", "blackboard", "devroom", "titles")
    music["tracks"].each_value { |track| expect(File.file?(File.join(project, track.fetch("file")))).to be(true) }
    expect(File.file?(File.join(project, "tools/p5/fonts/chalk.ttf"))).to be(true)
    expect(File.file?(File.join(project, ".skill/assets/templates/ending/end-card.png"))).to be(true)
  end

  it "registers original reference bytes once, without generating an image or replacing an identity" do
    image = file("sheet.png"); File.write(image, "immutable-reference")
    run = "rspec-lesson-ref-#{Process.pid}"
    client = double("upload client")
    expect(client).to receive(:upload).with(image).once.and_return("https://cdn.test/original")
    importer = Pipeline::ReferenceImporter.new
    first = importer.register(run: run, image: image, client: client)
    expect(first["provenance"][:sha256]).to eq(Digest::SHA256.file(image).hexdigest)
    expect(importer.register(run: run, image: image, client: client)["url"]).to eq(first["url"])
    File.write(image, "changed-identity")
    expect { importer.register(run: run, image: image, client: client) }.to raise_error(/another identity/)
  ensure
    FileUtils.rm_rf(File.join(Pipeline::ROOT, "output", run)) if run
  end

  it "sends the saved voices and timestamp request through the v4 adapter" do
    client = double("Fal")
    [["George", 0.45, 11], ["Liam", 0.5, 41]].each do |voice, stability, seed|
      expect(client).to receive(:run).with("elevenlabs/tts/eleven-v4", hash_including(
        text: "A lesson line.", voice: voice, stability: stability, seed: seed, timestamps: true,
        output_format: "mp3_44100_192")).and_return(["tts-test", {"audio" => {"url" => "https://cdn.test/voice"}}])
      Fal::Models::ElevenTts.new(client: client).speak(text: "A lesson line.", voice: voice, stability: stability, seed: seed)
    end
  end

  it "never calls Fal or changes local music bytes, even when forced" do
    FileUtils.mkdir_p(file("prompts/bed"))
    File.write(file("original.wav"), "original-music-bytes")
    File.write(file("prompts/bed/music.yml"), {"tracks" => {"intro" => {"file" => "original.wav"}}, "segments" => [{"from" => 0, "to" => 1, "track" => "intro"}]}.to_yaml)
    stub_const("Media::MusicBed::ROOT", fixtures)
    expect(Fal::Client).not_to receive(:new)
    bed = Media::MusicBed.new("bed")
    expect(bed.generate(force: true)).to eq([])
    expect(File.read(bed.wav("intro"))).to eq("original-music-bytes")
    FileUtils.rm(file("original.wav"))
    expect { bed.generate }.to raise_error(/Local music track missing/)
  end

  it "permits the lesson provider tasks through the credential task boundary" do
    expect(Toolkit::CredentialTasks::TASKS).to include("sfx:gen", "music:gen", "ref:register")
    expect(Toolkit::CredentialTasks::TASKS).not_to include("narration:build", "music:bed")
  end
end

RSpec.describe "Narration and reusable background beds", :media do
  it "renders the explainer typography, code, diagram, card and caption helpers with preserved fonts" do
    fonts = File.join(SKILL, "assets/lesson/fonts")
    FileUtils.cp_r(fonts, file("fonts"))
    sketch = File.read(File.join(RT, "tools/p5/examples/ex_smoke.js"))
    mapping = {chalk: "chalk.ttf", mono: "mono.ttf", tag: "din-alt.ttf", title: "din-cond.ttf", body: "body.ttf", math: "math-it.otf"}
    base = fixtures.delete_prefix(RT) + "/fonts/"
    loads = mapping.map { |name, font| "#{name}: await loadFont(#{(base + font).to_json})" }.join(", ")
    sketch.sub!(/this\.f = await Anim\.fonts\(.*?\);/, "this.f = {#{loads}};")
    File.write(file("explainer.js"), sketch)
    result = Media::Anim.new.render(file("explainer.js"), file("ex-frames"), width: 1920, height: 1080, fps: 24, frames: 48, only: [0, 24, 47])
    expect(result["frames"]).to eq(3)
    expect(Digest::SHA256.file(file("ex-frames/0000.png")).hexdigest).not_to eq(Digest::SHA256.file(file("ex-frames/0047.png")).hexdigest)
  end

  it "generates only the selected TTS line, keeps voice alignment metadata and reuses its cache" do
    stub_const("Media::Sfx::ROOT", fixtures)
    FileUtils.mkdir_p(file("prompts/narration"))
    spec = {"tts" => "Hello class", "voice" => "George", "stability" => 0.45, "seed" => 11}
    File.write(file("prompts/narration/sfx.yml"), {"sounds" => {"p01" => spec, "d01" => spec.merge("voice" => "Liam")}}.to_yaml)
    audio = tone(file("line.wav"))
    client = double("Fal download")
    expect(client).to receive(:download).with("https://cdn.test/line", anything) { |_, path| FileUtils.cp(audio, path) }
    model = double("v4")
    allow(Fal::Models::ElevenTts).to receive(:new).with(client: client).and_return(model)
    expect(model).to receive(:speak).with(text: "Hello class", voice: "George", stability: 0.45, similarity_boost: 0.75, seed: 11)
      .and_return(Fal::Models::Base::Result.new(request_id: "line-1", output: {"audio" => {"url" => "https://cdn.test/line"}, "timestamps" => [{"word" => "Hello", "start" => 0, "end" => 0.5}]}))
    sfx = Media::Sfx.new("narration")
    expect(sfx.generate(only: ["p01"], client: client)).to eq(["p01"])
    expect(sfx.generate(only: ["p01"], client: client)).to eq([])
    meta = JSON.parse(File.read(file("output/narration/sounds/p01.json")))
    expect(meta["timestamps"].first["word"]).to eq("Hello")
    expect(meta["request_id"]).to eq("line-1")
    expect(File.exist?(file("output/narration/sounds/d01.wav"))).to be(false)
  end

  it "ducks preserved music under speech, holds an intentional pause and preserves all video frames" do
    stub_const("Media::MusicBed::ROOT", fixtures)
    voice = file("voice.wav")
    ff.run("ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=700:sample_rate=48000:duration=2", "-af", "adelay=1000,apad", "-t", "6", "-ac", "2", voice)
    track = file("bed.wav")
    ff.run("ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=220:sample_rate=48000:duration=2", "-ac", "2", track)
    hash = Digest::SHA256.file(track).hexdigest
    source = video(file("clean.mp4"), audio: voice, seconds: 6)
    FileUtils.mkdir_p(file("prompts/bed"))
    cfg = {"source" => source, "out" => file("mixed.mp4"), "voice" => voice, "base_db" => -30, "duck_db" => -12,
      "tracks" => {"intro" => {"file" => track}}, "segments" => [{"from" => 0, "to" => 3, "track" => "intro"}, {"from" => 4, "to" => 6, "track" => "intro", "duck" => false}]}
    File.write(file("prompts/bed/music.yml"), cfg.to_yaml)
    # The Ruby service's Python backend lives in the real runtime, while data lives in this fixture.
    FileUtils.mkdir_p(file("tools/python"))
    FileUtils.cp(File.join(RT, "tools/python/music_bed.py"), file("tools/python/music_bed.py"))
    out, report = Media::MusicBed.new("bed").mix
    expect(ff.summary(out).dig(:video, :frames)).to eq(144)
    segment = report["segments"].first
    expect(segment["bed_speaking_db"]).to be < segment["bed_idle_db"] - 5
    expect(report["mix_peak_db"]).to be <= -1
    raw = ff.run("ffmpeg", "-v", "error", "-ss", "3.2", "-t", "0.5", "-i", file("output/bed/bed.wav"), "-f", "f32le", "-", quiet: true).unpack("e*")
    expect(raw.map(&:abs).max).to eq(0.0)
    expect(Digest::SHA256.file(track).hexdigest).to eq(hash)
  end
end
