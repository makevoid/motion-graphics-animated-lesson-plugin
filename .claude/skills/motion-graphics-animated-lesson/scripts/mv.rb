#!/usr/bin/env ruby
require "optparse"
require "fileutils"
require "json"
require "rbconfig"
require "open3"
runtime = __dir__
options = {}
parser = OptionParser.new do |o|
  o.banner = "Usage: ruby scripts/mv.rb [--project DIR] TASK [task arguments]\n       ruby scripts/mv.rb init --project DIR --prompt-file FILE [--song NARRATION_FILE]\nRuby is the only execution entry. Tasks use ENV RUN/ONLY/FORCE/VFX/SFX."
  o.on("--project DIR", "Project workspace (defaults to bundled runtime)") { |v| options[:project] = File.expand_path(v) }
  o.on("--song FILE", "Optional existing narration master for init") { |v| options[:song] = File.expand_path(v) }
  o.on("--prompt-file FILE", "Creative brief for init") { |v| options[:prompt] = File.expand_path(v) }
  o.on("-T", "List all rake tasks") { options[:list] = true }
  o.on("--help", "Show tasks and exit") { puts o; puts "Tasks: init, setup, doctor, test, plan:approve, work:next, work:accept, audio:analyze, audio:transcribe, media:stems, gen:<step>, review:<step>, pipeline:all, anim:preview, anim:overlay, media:preview, sfx:gen, narration:build, music:gen, music:bed, sfx:mix, ref:register, vfx:render. Use -T for the complete rake task list.\nExit: 0 success; 1 task/runtime failure; 2 invalid CLI or missing input. No interactive shell prompts."; exit }
end
begin
  parser.parse!(ARGV)
  command = options[:list] ? "-T" : (ARGV.shift || "pipeline:status")
  if command == "init"
    require_relative "lib/toolkit/initializer"
    puts JSON.pretty_generate(Toolkit::Initializer.new(runtime).create(project: options[:project], song: options[:song], prompt: options[:prompt]))
    exit
  end
  project = options[:project] || runtime
  raise ArgumentError, "No project Rakefile in #{project}; use init first" unless File.file?(File.join(project, "Rakefile"))
  Dir.chdir(project)
  if command == "setup"
    # Bootstrap gems before loading any runtime dependencies.
    ok = system(RbConfig.ruby, "-S", "bundle", "install")
    raise "bundle install failed" unless ok
  end
  ENV["BUNDLE_GEMFILE"] = File.join(project, "Gemfile")
  require "bundler/setup"
  require "rake"
  args = command == "-T" ? ["-T"] : [command, *ARGV]
  Rake.application.run(args)
rescue OptionParser::ParseError, ArgumentError => e
  warn "Error: #{e.message}\n#{parser}"
  exit 2
rescue StandardError => e
  warn "Error: #{e.message}"
  exit 1
end
