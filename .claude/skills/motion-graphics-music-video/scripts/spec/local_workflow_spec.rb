require_relative "spec_helper"

RSpec.describe "Local soundtrack and prepared overlay", :media do
  it "renders a first overlay from existing global word timings without any Fal client" do
    song = tone(duration: 3)
    run = "e2e-local-#{Process.pid}-#{object_id}"
    project = Pipeline::Project.new(run)
    stub_const("Pipeline::GENERATIONS", { run => { steps: [Pipeline::Steps::Music, Pipeline::Steps::Keyframes, Pipeline::Steps::Overlay],
                                                  **Pipeline.section(24, 4), music_from: song, upload_music: false, plate: "paper" } })
    expect(Fal::Client).not_to receive(:new)
    Pipeline::Steps::Music.new(project: project).run!
    expect(project[:music]["url"]).to be_nil
    expect(ff.duration(project[:music]["path"])).to be_within(0.002).of(4 / 24.0)
    plate = character
    project.record(:keyframes, items: { paper: { path: plate } })
    dir = File.join(RT, "prompts", run)
    FileUtils.mkdir_p(dir)
    File.write(File.join(dir, "05_overlay.js"), "Anim.sketch({draw(){background('#202060');fill('white');rect(20,20,120,120)}})")
    json(file("words.json"), chunks: [{text: "before", timestamp: [0.0,0.5]}, {text: "here", timestamp: [1.05,1.12]}, {text: "after", timestamp: [2,2.5]}])
    overlay = Pipeline::Steps::Overlay.new(project: project)
    expect(overlay.prepare!(file("words.json"))[:count]).to eq(1)
    words = JSON.parse(File.read(project.path("05_overlay", "words.json")))
    expect(words.first["s"]).to be_within(1e-6).of(0.05)
    result = overlay.render!
    expect(project[:overlay]["frames_dir"]).to eq(result[:frames_dir])
    expect(ff.summary(result[:path]).dig(:video,:frames)).to eq(4)
  end
end
