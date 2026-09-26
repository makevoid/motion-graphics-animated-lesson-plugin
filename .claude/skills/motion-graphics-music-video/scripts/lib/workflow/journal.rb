require "json"
require "fileutils"
require "time"

module Workflow
  # Persistent, bounded progress reporting for real host-managed sub-agents.
  class Journal
    def initialize(dir = ENV.fetch("LOG_DIR", "logs"))
      @dir = File.expand_path(dir)
    end

    def append(agent:, event:, message:, artifact: nil, request_id: nil)
      raise ArgumentError, "AGENT must be a simple worker ID" unless agent.to_s.match?(/\A[a-zA-Z0-9_-]+\z/)
      raise ArgumentError, "EVENT and MESSAGE are required" if event.to_s.empty? || message.to_s.empty?
      entry = { time: Time.now.iso8601, agent: agent, event: event, message: message,
                artifact: artifact, request_id: request_id }.compact
      FileUtils.mkdir_p(@dir)
      File.open(File.join(@dir, "#{agent}.jsonl"), "a") do |file|
        file.flock(File::LOCK_EX)
        file.puts(JSON.generate(entry))
        file.flush
      end
      entry
    end

    def snapshot(limit: 5)
      raise ArgumentError, "LIMIT must be between 1 and 50" unless (1..50).cover?(limit)
      Dir[File.join(@dir, "*.jsonl")].sort.map do |path|
        entries = []
        File.open(path, "r") do |file|
          file.flock(File::LOCK_SH)
          file.each_line do |line|
            entries << JSON.parse(line)
            entries.shift if entries.size > limit
          end
        end
        { agent: File.basename(path, ".jsonl"), path: path,
          seconds_since_update: (Time.now - File.mtime(path)).round,
          entries: entries }
      end
    end
  end
end
