require "fileutils"
require "json"
module Toolkit
  class Initializer
    EXCLUDED = %w[node_modules .venv .bundle output tmp specs .build prompts config docs audio .skill __pycache__].freeze
    def initialize(runtime) = @runtime = runtime
    def copy_tree(source, destination)
      FileUtils.mkdir_p(destination)
      Dir.children(source).each do |entry|
        next if EXCLUDED.include?(entry)
        src, dst = File.join(source, entry), File.join(destination, entry)
        File.directory?(src) ? copy_tree(src, dst) : FileUtils.cp(src, dst)
      end
    end
    def create(project:, prompt:, song: nil)
      raise ArgumentError, "init requires --project and --prompt-file" unless project && prompt
      raise ArgumentError, "Audio or prompt file missing" unless File.file?(prompt) && (song.nil? || File.file?(song))
      raise ArgumentError, "Project must be a new or empty directory" if File.exist?(project) && (!File.directory?(project) || !Dir.children(project).empty?)
      copy_tree(@runtime, project)
      origin = File.file?(File.expand_path("../SKILL.md", @runtime)) ? File.expand_path("..", @runtime) : File.join(@runtime, ".skill")
      if File.file?(File.join(origin, "SKILL.md"))
        target = File.join(project, ".skill")
        FileUtils.mkdir_p(target)
        %w[SKILL.md references assets].each { |entry| FileUtils.cp_r(File.join(origin, entry), target) }
      end
      %w[audio config docs prompts output].each { |d| FileUtils.mkdir_p(File.join(project, d)) }
      ext = song ? File.extname(song) : ".wav"
      FileUtils.cp(song, File.join(project, "audio", "source#{ext}")) if song
      install_lesson_defaults(project)
      FileUtils.cp(prompt, File.join(project, "docs", "BRIEF.md"))
      File.write(File.join(project, "config/generations.rb"), "# Evaluated inside Pipeline; see the skill task reference.\n{}\n")
      File.write(File.join(project, "config/production.json"), JSON.pretty_generate(wave: 0, jobs: []))
      File.write(File.join(project, "config/project.json"), JSON.pretty_generate(song_source: "audio/source#{ext}", fps: 24, mode: "animated-lesson", audio_ready: !song.nil?))
      { project: project, next: song ? "setup; fonts:list and review config/fonts.json; fonts:copy[config/fonts.json]; audio:analyze[audio/source#{ext},audio]; plan the lesson" : "setup; fonts:list and review config/fonts.json; fonts:copy[config/fonts.json]; research and script; record production authorization; sfx:gen (SFX=narration); narration:build; audio:analyze[audio/source.wav,audio]" }
    end

    def install_lesson_defaults(project)
      assets = File.join(project, ".skill", "assets")
      defaults = File.join(assets, "starter")
      return unless File.directory?(defaults)
      FileUtils.cp_r(Dir.glob(File.join(defaults, "*")), project)
      # Fonts are not bundled: seed a default system-font selection to review with fonts:list, then fonts:copy.
      FileUtils.mkdir_p(File.join(project, "tools/p5/fonts"))
      FileUtils.cp(File.join(assets, "lesson", "fonts", "default-selection.json"), File.join(project, "config/fonts.json"))
    end
  end
end
