require_relative "spec_helper"

RSpec.describe "Seeded sprite cleanup through the Ruby CLI", :media do
  def alpha_fixture
    source = file("source")
    FileUtils.mkdir_p(source)
    path = File.join(source, "0000.png")
    magick.run("magick", "-size", "160x100", "xc:none", "-fill", "rgba(230,40,90,0.35)",
               "-draw", "rectangle 11,17 33,59", "-fill", "rgba(230,40,90,0.8)",
               "-draw", "rectangle 12,18 32,58", "-font", Media::FONT,
               "-pointsize", "20", "-fill", "white", "-annotate", "+67+29", "TEXT", path)
    [source, path]
  end

  it "retains exact subject RGBA including soft alpha, removes detached text, and leaves the source unchanged" do
    source, path = alpha_fixture
    before = pixels(path)
    digest = Digest::SHA256.file(path).hexdigest
    out = file("clean")
    stdout, stderr, status = cli("media:keep_component[#{source},#{out},22,35]")
    expect(status.success?).to be(true), stderr
    report = JSON.parse(stdout)
    expect(report.fetch("frames")).to eq(1)
    expect(report.dig("metrics", 0, "removed_pixels")).to be > 0
    after = pixels(File.join(out, "0000.png"))
    subject = (17..59).flat_map { |y| (11..33).map { |x| y * 160 + x } }
    expect(after.values_at(*subject)).to eq(before.values_at(*subject))
    caption = (0...100).flat_map { |y| (60...160).map { |x| y * 160 + x } }
    expect(caption.count { |i| before[i][3].positive? }).to be > 0
    expect(caption.map { |i| after[i][3] }.uniq).to eq([0])
    expect(Digest::SHA256.file(path).hexdigest).to eq(digest)
  end

  it "rejects source overwrite, invalid coordinates and absent seed without publishing partial frames" do
    source, path = alpha_fixture
    digest = Digest::SHA256.file(path).hexdigest
    _, error, status = cli("media:keep_component[#{source},#{source},22,35]")
    expect(status.success?).to be(false)
    expect(error).to include("different directories")
    [["-1", "35", "nonnegative"], ["160", "35", "outside image bounds"],
     ["zero", "35", "invalid value"], ["0", "0", "component is absent"]].each do |x, y, message|
      out = file("invalid-#{x}-#{y}")
      _, error, status = cli("media:keep_component[#{source},#{out},#{x},#{y}]")
      expect(status.success?).to be(false)
      expect(error).to include(message)
      expect(File.exist?(out)).to be(false)
    end
    magick.run("magick", "-size", "160x100", "xc:none", File.join(source, "0001.png"))
    out = file("partial")
    _, error, status = cli("media:keep_component[#{source},#{out},22,35]")
    expect(status.success?).to be(false)
    expect(error).to include("0001.png", "component is absent")
    expect(File.exist?(out)).to be(false)
    expect(Digest::SHA256.file(path).hexdigest).to eq(digest)
  end
end

RSpec.describe "Sprite bounds through the Ruby CLI", :media do
  it "reports a green-screen character's box and seed as JSON for a still and a video" do
    still = character(width: 320, height: 180)
    [still, video(image: still)].each do |source|
      stdout, stderr, status = cli("media:sprite_box[#{source},green]")
      expect(status.success?).to be(true), stderr
      report = JSON.parse(stdout)
      x0, y0, x1, y1 = report.fetch("extent")
      expect(x0).to be_within(3).of(128)
      expect(x1).to be_within(3).of(192)
      expect(y0).to be_within(3).of(36)
      expect(y1).to be_within(3).of(144)
      bx, by, bw, bh = report.fetch("box")
      [[bx, x0 - 24], [by, y0 - 24], [bx + bw, x1 + 24], [by + bh, y1 + 24]].each { |got, want| expect(got).to be_within(1).of(want) }
      expect(report.fetch("seed")).to eq([(x0 + x1) / 2, (y0 + y1) / 2])
    end
  end
end
