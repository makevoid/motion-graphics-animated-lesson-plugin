require_relative "spec_helper"
require_relative "../lib/media/narration"

RSpec.describe "Explainer tools (narration timeline, prop-sheet slicing)", :media do
  # mono 16-bit 48 kHz line: `lead` s of silence, `dur` s of tone, `tail` s of silence
  def line_wav(path, lead:, dur:, tail:, freq: 440)
    ff.run("ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=#{freq}:sample_rate=48000:duration=#{dur}",
           "-af", "adelay=#{(lead * 1000).round}|#{(lead * 1000).round},apad=pad_dur=#{tail}", "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", path)
    path
  end

  def chunks(text, start, step)
    chars = text.chars
    [{ "characters" => chars, "character_start_times_seconds" => chars.each_index.map { |i| (start + i * step).round(3) },
       "character_end_times_seconds" => chars.each_index.map { |i| (start + (i + 1) * step).round(3) } }]
  end

  it "trims, places and stems narration lines and shifts ElevenLabs character timestamps onto the master" do
    sfx = "rspec-narration-#{Process.pid}"
    sounds = File.join(Media::Narration::ROOT, "output", sfx, "sounds")
    FileUtils.mkdir_p(sounds)
    begin
      line_wav(File.join(sounds, "a.wav"), lead: 0.5, dur: 1.0, tail: 0.3)
      line_wav(File.join(sounds, "b.wav"), lead: 0.2, dur: 0.8, tail: 0.2, freq: 660)
      json(File.join(sounds, "a.json"), { "timestamps" => chunks("Hi there", 0.5, 0.1) })
      json(File.join(sounds, "b.json"), { "timestamps" => chunks("Yes.", 0.2, 0.2) })
      config = file("narration.yml")
      File.write(config, { "sfx" => sfx, "lead_in" => 1.0, "tail" => 0.5, "gap" => 0.4, "out" => file("master.wav"),
                           "words" => file("words.json"), "stems" => file("stems"), "lines_out" => file("lines.json"),
                           "lines" => [{ "sound" => "a", "speaker" => "prof" }, { "sound" => "b", "speaker" => "bot" }] }.to_yaml)
      result = Media::Narration.new(config).build
      lines = JSON.parse(File.read(file("lines.json")))["lines"]
      a, b = lines
      expect(a["at"]).to eq(1.0)                                  # first line starts at lead_in, no default gap
      expect(a["trim"]).to be_within(0.03).of(0.47)               # 0.5 s lead trimmed, 30 ms breath kept
      expect(b["at"]).to be_within(0.01).of(a["at"] + a["dur"] + 0.4)
      expect(result[:duration]).to be_within(0.02).of(b["at"] + b["dur"] + 0.5)
      expect(ff.duration(file("stems/prof.wav"))).to be_within(0.01).of(ff.duration(file("master.wav")))
      words = JSON.parse(File.read(file("words.json")))
      expect(words.map { |w| w["w"] }).to eq(%w[Hi there Yes.])
      expect(words.first["s"]).to be_within(0.01).of(0.5 + a["at"] - a["trim"])   # tone onset lands at the line's `at` (+breath)
      expect(words.last["speaker"]).to eq("bot")
      before = File.binread(file("words.json"))
      cfg = YAML.safe_load_file(config); cfg["tail"] += 3.0; File.write(config, cfg.to_yaml)
      extended = Media::Narration.new(config).build
      expect(File.binread(file("words.json"))).to eq(before)
      expect(extended[:duration]).to be_within(0.001).of(result[:duration] + 3.0)

    ensure
      FileUtils.rm_rf(File.join(Media::Narration::ROOT, "output", sfx))
    end
  end

  it "slices a green prop sheet into named transparent sprites with a valid index" do
    sheet = file("sheet.png")
    magick.run("magick", "-size", "600x300", "xc:#00B140", "-fill", "#C08040", "-draw", "rectangle 40,60 200,240",
               "-fill", "#3050E0", "-draw", "circle 450,150 450,70", "-fill", "#C08040", "-draw", "rectangle 560,10 566,16", sheet)
    out, err, status = cli("--project", RT, "media:split_sheet[#{sheet},#{file("sprites")},box;ball,0.01]")
    expect(status).to be_success, err
    index = JSON.parse(File.read(file("sprites/index.json")))
    expect(index.map { |p| p["name"] }).to eq(%w[box ball])        # reading order; the 6 px speck is below min-area
    expect(index.first["box"]).to all(be_a(Integer))
    corner = pixels(file("sprites/box.png")).first
    expect(corner[3]).to eq(0)
    expect(out).to include("\"count\"")
  end
end
