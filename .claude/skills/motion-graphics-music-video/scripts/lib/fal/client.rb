require "excon"
require "json"
require "uri"
require "logger"
require "fileutils"
require "digest"

module Fal
  class Error < StandardError; end

  class RequestError < Error
    attr_reader :status, :body

    def initialize(status, body)
      @status = status
      @body = body
      super("fal request failed (HTTP #{status}): #{body}")
    end
  end

  # Thin Excon wrapper around the fal queue API:
  #   POST https://queue.fal.run/{endpoint_id}          -> { request_id, status_url, response_url }
  #   GET  {status_url}?logs=1                          -> { status: IN_QUEUE | IN_PROGRESS | COMPLETED }
  #   GET  {response_url}                               -> model output
  class Client
    QUEUE_HOST = "https://queue.fal.run".freeze
    STORAGE_INITIATE = "https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3".freeze
    KEY_PATH = File.expand_path("~/.fal_ai_api_key").freeze

    attr_reader :logger

    def initialize(api_key: nil, logger: Logger.new($stderr), poll_interval: 3, timeout: 1800)
      @api_key = api_key || ENV["FAL_KEY"] || (File.read(KEY_PATH).strip if File.file?(KEY_PATH))
      raise Error, 'Missing FAL_KEY (or ~/.fal_ai_api_key)' if @api_key.to_s.empty?
      @logger = logger
      @poll_interval = poll_interval
      @timeout = timeout
    end

    # Submit + poll + fetch result. Returns [request_id, result_hash].
    def run(endpoint_id, input)
      require_relative "../workflow/approval"
      Workflow::Approval.new.check!
      require "digest"
      FileUtils.mkdir_p("output/requests")
      fingerprint = Digest::SHA256.hexdigest(JSON.generate([endpoint_id, input]))
      receipt = "output/requests/#{fingerprint}.json"
      File.open("#{receipt}.lock", File::CREAT | File::RDWR) do |lock|
        lock.flock(File::LOCK_EX)
        if File.exist?(receipt) && ENV["NEW_REQUEST"] != "1"
          submission = JSON.parse(File.read(receipt))
        else
          submission = submit(endpoint_id, input)
          File.write("#{receipt}.tmp", JSON.pretty_generate(submission))
          File.rename("#{receipt}.tmp", receipt)
        end
        request_id = submission.fetch("request_id")
        logger.info("[fal] #{endpoint_id} request_id=#{request_id}; receipt=#{receipt}")
        wait(submission.fetch("status_url"))
        return [request_id, get_json(submission.fetch("response_url"))]
      end
    end

    # Re-fetch a completed request's output (queue results are addressed by app id,
    # i.e. the first two path segments: fal-ai/nano-banana-2/edit -> fal-ai/nano-banana-2).
    def result(endpoint_id, request_id)
      get_json("#{QUEUE_HOST}/#{endpoint_id.split("/").first(2).join("/")}/requests/#{request_id}")
    end

    def submit(endpoint_id, input)
      request(:post, "#{QUEUE_HOST}/#{endpoint_id}", body: JSON.generate(input))
    end

    def wait(status_url)
      started = Time.now
      last_log = 0
      loop do
        status = get_json("#{status_url}?logs=1")
        logs = Array(status["logs"])
        logs[last_log..]&.each { |l| logger.info("[fal]   #{l["message"]}") }
        last_log = logs.size
        case status["status"]
        when "COMPLETED"
          raise Error, "fal job failed: #{status["error"]}" if status["error"]
          return status
        when "IN_QUEUE"
          logger.info("[fal]   queued (position #{status["queue_position"]})")
        end
        raise Error, "timed out after #{@timeout}s" if Time.now - started > @timeout
        sleep @poll_interval
      end
    end

    def get_json(url)
      request(:get, url)
    end

    # Upload a local file to fal CDN, returns a public URL usable as *_url input.
    def upload(path, content_type: Media.mime_type(path))
      FileUtils.mkdir_p("output/uploads")
      key = Digest::SHA256.hexdigest([Digest::SHA256.file(path).hexdigest, content_type].join(":"))
      cache = "output/uploads/#{key}.json"
      File.open("#{cache}.lock", File::CREAT | File::RDWR) do |lock|
        lock.flock(File::LOCK_EX)
        return JSON.parse(File.read(cache)).fetch("url") if File.file?(cache) && ENV["REFRESH_UPLOAD"] != "1"
        url = upload_uncached(path, content_type: content_type)
        File.write("#{cache}.tmp", JSON.generate(url: url))
        File.rename("#{cache}.tmp", cache)
        url
      end
    end

    def upload_uncached(path, content_type: Media.mime_type(path))
      init = request(:post, STORAGE_INITIATE,
                     body: JSON.generate(content_type: content_type, file_name: File.basename(path)))
      resp = Excon.put(init.fetch("upload_url"),
                       body: File.binread(path),
                       headers: { "Content-Type" => content_type })
      raise RequestError.new(resp.status, resp.body) unless (200..299).cover?(resp.status)
      logger.info("[fal] uploaded #{path} -> #{init["file_url"]}")
      init.fetch("file_url")
    end

    # Download a fal CDN URL to a local path.
    def download(url, path)
      File.open(path, "wb") do |f|
        streamer = ->(chunk, _remaining, _total) { f.write(chunk) }
        resp = Excon.get(url, response_block: streamer, middlewares: Excon.defaults[:middlewares] + [Excon::Middleware::RedirectFollower])
        raise RequestError.new(resp.status, "download #{url}") unless resp.status == 200
      end
      logger.info("[fal] downloaded #{url} -> #{path}")
      path
    end

    private

    def request(method, url, body: nil)
      resp = Excon.new(url, read_timeout: 120, write_timeout: 300).request(
        method: method,
        body: body,
        headers: { "Authorization" => "Key #{@api_key}", "Content-Type" => "application/json", "Accept" => "application/json" },
        idempotent: method == :get, retry_limit: 3
      )
      raise RequestError.new(resp.status, resp.body) unless (200..299).cover?(resp.status)
      resp.body.empty? ? {} : JSON.parse(resp.body)
    end
  end
end
