require_relative "spec_helper"

RSpec.describe Toolkit::Fonts, :core do
  subject(:fonts) { described_class.new }

  it "discovers supported font files recursively, ignoring collections and missing roots" do
    root = file("installed")
    FileUtils.mkdir_p(File.join(root, "Supplemental"))
    %w[face.TTF face.otf collection.ttc notes.txt].each { |name| File.write(File.join(root, "Supplemental", name), name) }
    expect(fonts.list([root, file("missing")]).map { |path| File.basename(path) }).to eq(%w[face.TTF face.otf])
  end

  it "copies only selected files unchanged, accepts spaces and commas, and allows identical reruns" do
    source = file("Selected face,variable.ttf")
    File.binwrite(source, "\x00\x01font bytes")
    File.write(file("unused.ttf"), "unused")
    json(file("fonts.json"), "title.ttf" => source)
    project = file("video project")
    result = fonts.copy(file("fonts.json"), project: project)
    expect(File.binread(result.first[:path])).to eq(File.binread(source))
    expect(result.first[:sha256]).to eq(Digest::SHA256.file(source).hexdigest)
    expect(Dir.children(File.join(project, "tools/p5/fonts"))).to eq(["title.ttf"])
    expect(fonts.copy(file("fonts.json"), project: project)).to eq(result)
    File.write(source, "replacement")
    expect { fonts.copy(file("fonts.json"), project: project) }.to raise_error(ArgumentError, /different bytes/)
    expect(File.binread(result.first[:path])).to eq("\x00\x01font bytes")
  end

  it "validates all selections before copying and rejects paths outside the font directory" do
    source = file("font.ttf")
    File.write(source, "font bytes")
    project = file("project")
    json(file("fonts.json"), "valid.ttf" => source, "missing.ttf" => file("absent.ttf"))
    expect { fonts.copy(file("fonts.json"), project: project) }.to raise_error(ArgumentError, /Missing/)
    expect(File.exist?(File.join(project, "tools/p5/fonts/valid.ttf"))).to be(false)
    json(file("fonts.json"), "../escape.ttf" => source)
    expect { fonts.copy(file("fonts.json"), project: project) }.to raise_error(ArgumentError, /without directories/)
  end
end
