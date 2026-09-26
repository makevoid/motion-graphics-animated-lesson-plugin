require "json"
require "digest"
require "fileutils"
require "time"
module Workflow
  class Approval
    def fingerprint
      raise "Write docs/PLAN.md with character prompts, scene prompts and costs first" unless File.file?("docs/PLAN.md")
      Digest::SHA256.file("docs/PLAN.md").hexdigest
    end
    def record!(note)
      raise ArgumentError, "NOTE must quote the user's explicit approval" if note.to_s.strip.empty?
      FileUtils.mkdir_p("config")
      data = { plan_sha256: fingerprint, user_approval: note, recorded_at: Time.now.iso8601 }
      File.write("config/approval.json", JSON.pretty_generate(data))
      data
    end
    def check!
      raise "Plan approval missing. Present docs/PLAN.md and obtain the user's approval before paid work." unless File.file?("config/approval.json")
      data = JSON.parse(File.read("config/approval.json"))
      raise "Plan changed since approval; obtain approval for the revised plan." unless data["plan_sha256"] == fingerprint
      true
    end
  end
end
