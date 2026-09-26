require "open3"
require "fileutils"
require "shellwords"

module Media
  class CommandError < StandardError; end

  MIME_TYPES = {
    ".png" => "image/png", ".jpg" => "image/jpeg", ".jpeg" => "image/jpeg", ".webp" => "image/webp",
    ".mp3" => "audio/mpeg", ".wav" => "audio/wav", ".m4a" => "audio/mp4",
    ".mp4" => "video/mp4", ".mov" => "video/quicktime", ".webm" => "video/webm"
  }.freeze

  # Explicit font file for magick labels / ffmpeg drawtext (no fontconfig default on macOS brew builds).
  FONT = [ENV["MEDIA_FONT"], "/System/Library/Fonts/Supplemental/Arial.ttf", "/Library/Fonts/Arial Unicode.ttf"]
           .compact.find { |f| File.exist?(f) }

  def self.mime_type(path)
    MIME_TYPES.fetch(File.extname(path).downcase, "application/octet-stream")
  end

  # Base for wrappers around local CLI tools (ffmpeg, magick, python3).
  class Shell
    def self.available?(bin)
      system("command -v #{bin.shellescape} > /dev/null 2>&1")
    end

    def run(*cmd, quiet: false)
      warn "  $ #{cmd.shelljoin}" unless quiet
      out, err, status = Open3.capture3(*cmd.map(&:to_s))
      raise CommandError, "#{cmd.first} failed (#{status.exitstatus}):\n#{err[-2000..] || err}" unless status.success?
      out
    end
  end
end
