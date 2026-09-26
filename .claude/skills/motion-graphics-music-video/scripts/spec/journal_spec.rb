require_relative "spec_helper"

RSpec.describe "Sub-agent progress journal", :core do
  it "keeps separate worker histories and returns bounded, attributable updates" do
    with_workspace do
      journal = Workflow::Journal.new("logs")
      7.times { |n| journal.append(agent: "scene-a", event: "progress", message: "step #{n}") }
      journal.append(agent: "scene-b", event: "submitted", message: "night scene", request_id: "fake-123")
      snapshot = journal.snapshot(limit: 2)
      expect(snapshot.map { |row| row[:agent] }).to eq(%w[scene-a scene-b])
      expect(snapshot.first[:entries].map { |row| row["message"] }).to eq(["step 5", "step 6"])
      expect(snapshot.last[:entries].first["request_id"]).to eq("fake-123")
      expect(File.readlines("logs/scene-a.jsonl").size).to eq(7)
      expect { journal.append(agent: "../escape", event: "bad", message: "bad") }.to raise_error(ArgumentError)
    end
  end
end
