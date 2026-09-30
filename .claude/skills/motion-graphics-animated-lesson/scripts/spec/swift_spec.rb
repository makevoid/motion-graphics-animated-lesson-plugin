require_relative "spec_helper"
RSpec.describe "Swift VFX end to end", :swift do
  it "applies a cued effect to a character scene, preserves outside frames and audio" do
    raise "Swift VFX requires macOS 14+ (use PROFILE=media/core elsewhere)" unless RUBY_PLATFORM.include?("darwin")
    source = video
      sprite = character
      meta = py.cutout(sprite, file("sprites"), "green")
      meta["dir"] = file("sprites").delete_prefix("#{RT}/")
      json(file("clips.json"), hero: meta)
      File.write(file("scene.js"), "Anim.sketch({async load(){this.s=await Anim.clip('hero')},draw(t,f){background('#244060');this.s.draw(this.s.frame(0),240,90,180);fill('#ffffff');rect(10+f,10,8,8)}})")
      Media::Anim.new.render(file("scene.js"),file("frames"),width:320,height:180,fps:24,frames:48,data:{clips:file("clips.json")})
      source = ff.overlay_frames(source,file("frames"),file("composed.mp4"),fps:24)
    name = "e2e-vfx-#{Process.pid}"
    dir = File.join(RT, "prompts", name); FileUtils.mkdir_p(dir)
    config = {"source" => source, "out" => file("effect.mp4"), "lights" => "tools/p5/examples/lights.js", "cues" => [{"fx" => "dark", "f" => 12, "dur" => 6, "hold" => 3, "amt" => 0.9}, {"fx" => "flare", "f" => 36, "dur" => 3, "amt" => 1, "x" => 0.5, "y" => 0.5}]}
    File.write(File.join(dir, "cues.yml"), YAML.dump(config))
    service = Media::Vfx.new(name)
    service.render
    info = ff.summary(file("effect.mp4"))
    expect(info.dig(:video, :frames)).to eq(48)
    expect(info.dig(:audio, :codec)).to eq("aac")
    [0,12,30,36].each do |frame|
      ff.frame_index(source, frame, file("before#{frame}.png"))
      ff.frame_index(file("effect.mp4"), frame, file("after#{frame}.png"))
    end
    expect(mean_luma(file("after12.png"))).to be < mean_luma(file("before12.png")) * 0.3
    [0,30].each { |frame| expect(mean_luma(file("after#{frame}.png"))).to be_within(0.02).of(mean_luma(file("before#{frame}.png"))) }
    before_light = magick.run("magick", file("before36.png"), "-crop", "60x40+130+70", "-colorspace", "gray", "-format", "%[fx:mean]", "info:", quiet: true).to_f
      after_light = magick.run("magick", file("after36.png"), "-crop", "60x40+130+70", "-colorspace", "gray", "-format", "%[fx:mean]", "info:", quiet: true).to_f
      expect(after_light).to be > before_light + 0.05
      expect(Dir[File.join(service.path("lights"),"*.png")].size).to eq(3)
      config["cues"] = [{"fx" => "unknown", "f" => 1, "dur" => 1}]
    File.write(File.join(dir, "cues.yml"), YAML.dump(config))
    expect { Media::Vfx.new(name).render }.to raise_error(ArgumentError, /unknown fx/)
  end
end
