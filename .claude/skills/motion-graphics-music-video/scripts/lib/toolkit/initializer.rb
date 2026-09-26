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
    def create(project:, song:, prompt:)
      raise ArgumentError, "init requires --project, --song, --prompt-file" unless project && song && prompt
      raise ArgumentError, "Song or prompt file missing" unless File.file?(song) && File.file?(prompt)
      raise ArgumentError, "Project must be a new or empty directory" if File.exist?(project) && (!File.directory?(project) || !Dir.children(project).empty?)
      copy_tree(@runtime, project)
      origin = File.file?(File.expand_path("../SKILL.md", @runtime)) ? File.expand_path("..", @runtime) : File.join(@runtime, ".skill")
      if File.file?(File.join(origin, "SKILL.md"))
        target = File.join(project, ".skill")
        FileUtils.mkdir_p(target)
        %w[SKILL.md references assets].each { |entry| FileUtils.cp_r(File.join(origin, entry), target) }
      end
      %w[audio config docs prompts output].each { |d| FileUtils.mkdir_p(File.join(project, d)) }
      ext = File.extname(song)
      FileUtils.cp(song, File.join(project, "audio", "source#{ext}"))
      FileUtils.cp(prompt, File.join(project, "docs", "BRIEF.md"))
      File.write(File.join(project, "config/generations.rb"), "# Evaluated inside Pipeline; see the skill task reference.\n{}\n")
      File.write(File.join(project, "config/production.json"), JSON.pretty_generate(wave: 0, jobs: []))
      File.write(File.join(project, "config/project.json"), JSON.pretty_generate(song_source: "audio/source#{ext}", fps: 24))
      { project: project, next: "setup, then audio:analyze[audio/source#{ext},audio]; write docs/PLAN.md before approval" }
    end
  end
end
