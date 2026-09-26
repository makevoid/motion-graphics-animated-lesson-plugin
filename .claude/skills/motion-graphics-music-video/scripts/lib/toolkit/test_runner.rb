require "rbconfig"
module Toolkit
  class TestRunner
    def run
      profile = ENV.fetch("PROFILE", "all")
      raise "PROFILE must be all, core, media, swift or live" unless %w[all core media swift live].include?(profile)
      if profile == "live"
        raise "Paid tests require LIVE_FAL=1, LIVE_SONG=/path/to/song.wav and LIVE_LYRICS='recognizable words'" unless ENV["LIVE_FAL"] == "1" && File.file?(ENV["LIVE_SONG"].to_s) && !ENV["LIVE_LYRICS"].to_s.strip.empty?
      end
      args = [RbConfig.ruby, "-S", "rspec", "spec", "--format", "documentation"]
      args += profile == "all" ? ["--tag", "~live"] : ["--tag", profile]
      ok = system(*args)
      raise "RSpec failed for PROFILE=#{profile}; see failures above" unless ok
    end
  end
end
