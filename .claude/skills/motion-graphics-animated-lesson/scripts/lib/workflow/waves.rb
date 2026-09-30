require "json"
require "fileutils"
module Workflow
  # The agent owns creative review and delegation. This class owns dependency/wave bookkeeping.
  class Waves
    FILE = "config/production.json"
    LIMITS = [2, 4, 8, 10].freeze
    def transaction
      File.open("#{FILE}.lock", File::CREAT | File::RDWR) do |lock|
        lock.flock(File::LOCK_EX)
        data = JSON.parse(File.read(FILE))
        validate!(data)
        result = yield data
        File.write("#{FILE}.tmp", JSON.pretty_generate(data))
        File.rename("#{FILE}.tmp", FILE)
        result
      end
    end
    def validate!(data)
      jobs = data.fetch("jobs")
      ids = jobs.map { |j| j.fetch("id") }
      raise "Duplicate job IDs" unless ids.uniq == ids
      jobs.each do |job|
        raise "Unknown job state" unless %w[pending running accepted].include?(job.fetch("state", "pending"))
        raise "Missing dependencies for #{job['id']}" unless (job.fetch("depends", []) - ids).empty?
      end
    end
    def next!(size = nil)
      transaction do |data|
        jobs = data.fetch("jobs")
        active = jobs.select { |j| j["state"] == "running" }
        next({ wave: data.fetch("wave", 0), jobs: active, resumed: true }) unless active.empty?
        wave = data.fetch("wave", 0)
        cap = LIMITS[[wave, 3].min]
        min = [2, 3, 4, 6][[wave, 3].min]
        n = size ? Integer(size) : cap
        raise "Wave #{wave + 1} size must be #{min}..#{cap}" unless (min..cap).cover?(n)
        accepted = jobs.select { |j| j["state"] == "accepted" }.map { |j| j["id"] }
        ready = jobs.select { |j| j.fetch("state", "pending") == "pending" && (j.fetch("depends", []) - accepted).empty? }
        picked = []
        ready.each do |job|
          # A worker exclusively owns a run (or resource, for non-run tasks).
          resource = job.fetch("resource", job["run"] || job["id"])
          next if picked.any? { |j| j.fetch("resource", j["run"] || j["id"]) == resource }
          picked << job
          break if picked.size == n
        end
        if picked.empty? && accepted.size != jobs.size
          raise "No jobs ready: check dependency cycles and states"
        end
        picked.each { |j| j["state"] = "running" }
        data["wave"] = wave + 1 unless picked.empty?
        { wave: data.fetch("wave", wave), jobs: picked, complete: accepted.size == jobs.size }
      end
    end
    def accept!(id, evidence)
      raise "EVIDENCE must name an existing review file" unless evidence && File.file?(evidence)
      transaction do |data|
        job = data["jobs"].find { |j| j["id"] == id } or raise "Unknown job #{id}"
        raise "Job #{id} is not in the active wave" unless job["state"] == "running"
        job.merge!("state" => "accepted", "evidence" => evidence)
      end
    end
  end
end
