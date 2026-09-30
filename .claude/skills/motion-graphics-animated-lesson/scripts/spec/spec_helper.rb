require "rspec"
require "tmpdir"
require "fileutils"
require "json"
require "yaml"
require "rbconfig"
require "open3"
require "digest"
require_relative "../lib/fal_mv_gen"
require_relative "../lib/toolkit/operations"
RT = File.expand_path("..", __dir__)
SKILL = File.file?(File.expand_path("../SKILL.md", RT)) ? File.expand_path("..", RT) : File.join(RT, ".skill")
ENTRY = File.join(RT, "mv.rb")
module Fixtures
  def ff = @ff ||= Media::FFmpeg.new
  def py = @py ||= Media::Python.new
  def magick = @magick ||= Media::ImageMagick.new
  def fixtures
    @fixtures ||= FileUtils.mkdir_p(File.join(RT, "tmp", "rspec-#{Process.pid}-#{object_id}")).first
  end
  def file(name) = File.join(fixtures, name)
  def json(path, value)
    FileUtils.mkdir_p(File.dirname(path)); File.write(path, JSON.pretty_generate(value))
  end
  def tone(path = file("song.wav"), duration: 2)
    # Half a second of final silence makes detection and pause tests observable.
    ff.run("ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=700:sample_rate=44100:duration=#{duration - 0.5}", "-af", "apad=whole_dur=#{duration}", "-t", duration, "-ac", "2", "-c:a", "pcm_s16le", path)
    path
  end
  def character(path = file("character.png"), width: 320, height: 180)
    magick.run("magick", "-size", "#{width}x#{height}", "xc:#00B140", "-fill", "#e02040", "-draw", "rectangle #{width * 0.4},#{height * 0.2} #{width * 0.6},#{height * 0.8}", path)
    path
  end
  def video(path = file("clip.mp4"), image: character, audio: tone, seconds: 2)
    ff.still_plate(image, audio, path, seconds: seconds, fps: 24, w: 320, h: 180)
  end
  def pixels(path)
    magick.run("magick", path, "-depth", "8", "rgba:-", quiet: true).bytes.each_slice(4).to_a
  end
  def mean_luma(path)
    magick.run("magick", path, "-colorspace", "gray", "-format", "%[fx:mean]", "info:", quiet: true).to_f
  end
  def approve
    FileUtils.mkdir_p("docs"); FileUtils.mkdir_p("config")
    File.write("docs/PLAN.md", "Synthetic test plan: local fixture media, no paid requests.\n")
    Workflow::Approval.new.record!("RSpec fixture approval; mocked network only")
  end
  def with_workspace
    Dir.mktmpdir("mv-spec-") { |dir| Dir.chdir(dir) { yield dir } }
  end
  def cli(*args, env: {})
    Open3.capture3(env, RbConfig.ruby, ENTRY, *args)
  end
end
RSpec.configure do |c|
  c.include Fixtures
  c.order = :defined
  c.before do
    @saved_env = ENV.to_h
    %w[RUN ONLY FORCE RECUT NEW_REQUEST VIDEO_RES].each { |k| ENV.delete(k) }
  end
  c.after do
    ENV.replace(@saved_env)
    Excon.stubs.clear
    Excon.defaults[:mock] = false
  end
  c.before(:suite) do
    Dir.chdir(RT)
    FileUtils.mkdir_p("tmp")
  end
end
