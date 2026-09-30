require "json"
require "fileutils"
require "time"

module Pipeline
  ROOT = File.expand_path("../..", __dir__)

  # One generation run: output/<run>/ with a manifest.json holding each step's
  # request_id, input, remote url and local file so steps can chain via rake.
  class Project
    attr_reader :name, :dir

    def initialize(name = ENV.fetch("RUN", DEFAULT_RUN))
      @name = name
      raise ArgumentError, 'RUN must contain only letters, digits, underscores and hyphens' unless name.match?(/\A[a-zA-Z0-9_-]+\z/)
      @dir = File.join(ROOT, "output", name)
      FileUtils.mkdir_p(dir)
    end

    def path(*parts)
      File.join(dir, *parts).tap { |p| FileUtils.mkdir_p(File.dirname(p)) }
    end

    def review_path(step, file)
      path("review", step.to_s, file)
    end

    def manifest
      File.exist?(manifest_path) ? JSON.parse(File.read(manifest_path)) : {}
    end

    def [](step)
      manifest[step.to_s]
    end

    # flock'd read-modify-write so steps can run in parallel processes.
    def record(step, data)
      File.open("#{manifest_path}.lock", File::CREAT | File::RDWR) do |lock|
        lock.flock(File::LOCK_EX)
        m = manifest
        m[step.to_s] = (m[step.to_s] || {}).merge(data.transform_keys(&:to_s)).merge("updated_at" => Time.now.iso8601)
        File.write("#{manifest_path}.tmp", JSON.pretty_generate(m))
        File.rename("#{manifest_path}.tmp", manifest_path)
        m[step.to_s]
      end
    end

    def fetch!(step, key)
      value = self[step]&.dig(key.to_s)
      raise "step '#{step}' has no '#{key}' yet — run `rake gen:#{step}` first (RUN=#{name})" unless value
      value
    end

    # A Keyframes item of this run, or of another run as "<run>/<keyframe>" (to reuse its framing, its green-screen pose or its paper).
    def keyframe(name)
      run, kf = name.include?("/") ? name.split("/", 2) : [nil, name]
      source = run ? Project.new(run) : self
      source.fetch!(:keyframes, :items).fetch(kf) { raise "no keyframe '#{kf}' in #{source.name} — add it to 02_keyframes.yml and run rake gen:keyframes" }
    end

    def generation
      GENERATIONS.fetch(name) { raise "unknown RUN=#{name} (#{GENERATIONS.keys.join(", ")}), add it to Pipeline::GENERATIONS" }
    end

    def steps = generation[:steps]
    def step?(step_class) = steps.include?(step_class)

    # Length of the song and the video, in seconds: `frames:` (at 24fps, for song sections on a shared frame grid) or `duration:`.
    def duration = generation[:frames] ? generation[:frames] / 24.0 : generation.fetch(:duration, 10)

    # Run this step's output is copied from (GENERATIONS import:), or nil.
    def import_source(step) = generation.fetch(:import, {})[step.to_sym]

    # prompts/<run>/<stem>.* — e.g. prompt("01_ref_base") reads 01_ref_base.txt or 01_ref_base.json.
    def prompt(stem) = File.read(prompt_path(stem))

    def prompt_path(stem)
      dir = File.join(ROOT, "prompts", name)
      Dir[File.join(dir, "#{stem}.*")].first or raise "no prompt #{stem}.* in #{dir}"
    end

    private

    def manifest_path = File.join(dir, "manifest.json")
  end
end
