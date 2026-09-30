require "json"

module Pipeline
  # A pipeline stage. Subclasses implement:
  #   #submit              -> calls fal, returns Fal::Models::Base::Result
  #   #materialize(result) -> downloads/post-processes a result, returns manifest data
  #   #review              -> local analysis (ffmpeg / magick / python), returns metrics hash
  # Splitting submit/materialize lets any past request_id be re-adopted (rake pick/adopt).
  class Step
    Result = Fal::Models::Base::Result

    attr_reader :project

    def self.key = name.split("::").last.gsub(/([a-z])([A-Z])/, '\1_\2').downcase.to_sym

    def initialize(project: Project.new, client: nil)
      @project = project
      @client = client
    end

    def key = self.class.key
    def done? = !!project[key]&.dig("path") && File.exist?(project[key]["path"])

    def run!(force: ENV["FORCE"] == "1")
      if done? && !force
        warn "[#{key}] already generated -> #{project[key]["path"]} (FORCE=1 to regenerate)"
        return project[key]
      end
      archive! if done?
      if (from = project.import_source(key))
        return import!(from)
      end
      warn "[#{key}] generating…"
      started = Time.now
      data = materialize(submit)
      project.record(key, data.merge(elapsed_s: (Time.now - started).round(1), review: nil))
    end

    # Make a previously completed fal request the current output (re-fetched from the queue).
    def adopt!(request_id)
      past = Array(project[key]&.dig("history")).find { |h| h["request_id"] == request_id } || {}
      archive! if done?
      output = client.result(endpoint, request_id)
      data = materialize(Result.new(request_id: request_id, input: past["input"], output: output))
      project.record(key, data.merge(review: nil))
      warn "[#{key}] adopted #{request_id} -> #{data[:path]}"
    end

    # Reuse another run's output for this step: same remote url, local files copied into this run.
    def import!(from)
      source = Project.new(from)[key] or raise "[#{key}] run '#{from}' has nothing to import (RUN=#{from} rake gen:#{key})"
      data = source.except("history", "updated_at").to_h do |k, v|
        next [k, v] unless k.end_with?("path") && v
        dest = project.path(File.basename(v))
        FileUtils.cp(v, dest)
        [k, dest]
      end
      warn "[#{key}] imported from #{from} -> #{data["path"]}"
      project.record(key, data.merge("imported_from" => from))
    end

    # rake pick[step,n] — adopt archived attempt n (1-based, see manifest history).
    def pick!(n)
      entry = Array(project[key]&.dig("history")).fetch(n - 1) { raise "no archived attempt #{n} for #{key}" }
      adopt!(entry.fetch("request_id"))
    end

    def review!
      raise "[#{key}] nothing to review, run `rake gen:#{key}` first" unless done?
      metrics = review
      File.write(project.review_path(key, "review.json"), JSON.pretty_generate(metrics))
      project.record(key, review: metrics.slice(:verdict, :checks))
      puts JSON.pretty_generate(metrics)
      metrics
    end

    protected

    def client = @client ||= Fal::Client.new
    def ffmpeg = @ffmpeg ||= Media::FFmpeg.new
    def magick = @magick ||= Media::ImageMagick.new
    def python = @python ||= Media::Python.new
    def seed = ENV["SEED"]&.to_i
    def endpoint = self.class::MODEL.endpoint

    # Common manifest fields for a fal result.
    def base_data(result)
      { request_id: result.request_id, endpoint: endpoint, input: result.input }
    end

    # Keep rejected attempts: copy of the primary file in output/<RUN>/rejected/ +
    # a full manifest snapshot (request_id, input, review) in history.
    def archive!
      entry = project[key]
      history = Array(entry["history"])
      if history.none? { |h| h["request_id"] == entry["request_id"] }
        dest = project.path("rejected", "#{key}_#{history.size + 1}#{File.extname(entry["path"])}")
        FileUtils.cp(entry["path"], dest)
        history += [entry.except("history").merge("archived" => dest)]
        project.record(key, history: history)
        warn "[#{key}] archived previous attempt -> #{dest}"
      end
    end

    def download(url, file)
      client.download(url, project.path(file))
    end

    # checks: { name => [ok?, detail] } -> verdict PASS / REVIEW
    def verdict(checks)
      {
        verdict: checks.values.all?(&:first) ? "PASS" : "REVIEW",
        checks: checks.transform_values { |ok, detail| "#{ok ? "ok" : "FAIL"} — #{detail}" }
      }
    end
  end
end
