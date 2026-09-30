require "fileutils"
require "json"
require "digest"

module Toolkit
  class Fonts
    # macOS (system, Supplemental, all-users, per-user), then common Linux and Windows locations.
    ROOTS = ["/System/Library/Fonts", "/Library/Fonts", File.expand_path("~/Library/Fonts"),
             "/usr/share/fonts", "/usr/local/share/fonts", File.expand_path("~/.local/share/fonts"), File.expand_path("~/.fonts"),
             "C:/Windows/Fonts"].freeze

    def list(roots = ROOTS)
      roots.flat_map { |root| Dir.glob(File.join(root, "**", "*")) }
        .select { |path| File.file?(path) && %w[.ttf .otf].include?(File.extname(path).downcase) }.uniq.sort
    end

    # JSON maps stable project filenames to selected absolute source paths.
    def copy(selection, project: Dir.pwd)
      map = JSON.parse(File.read(selection))
      raise ArgumentError, "Font selection must be a nonempty JSON object" unless map.is_a?(Hash) && !map.empty?
      destination = File.join(project, "tools/p5/fonts")
      files = map.map do |name, source|
        unless name == File.basename(name) && %w[.ttf .otf].include?(File.extname(name).downcase)
          raise ArgumentError, "Use a .ttf or .otf filename without directories: #{name}"
        end
        unless source.is_a?(String) && source.start_with?("/") && File.file?(source) && File.extname(source).downcase == File.extname(name).downcase
          raise ArgumentError, "Missing or incompatible absolute font source: #{source}"
        end
        target = File.join(destination, name)
        if File.exist?(target) && Digest::SHA256.file(source) != Digest::SHA256.file(target)
          raise ArgumentError, "Font already exists with different bytes; choose a new filename: #{target}"
        end
        [source, target]
      end
      FileUtils.mkdir_p(destination)
      files.each { |source, target| FileUtils.cp(source, target) unless File.exist?(target) }
      files.map { |source, target| { source: source, path: target, sha256: Digest::SHA256.file(target).hexdigest } }
    end
  end
end
