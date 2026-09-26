require "rake"
require_relative "fal_mv_gen"
require_relative "toolkit/operations"
module Toolkit
  class Tasks
    extend Rake::DSL
    def self.install
      Operations::TASKS.each do |name, description|
        desc description
        task(name) { |_, args| Operations.new.call(name, args.extras) }
      end
      Pipeline::ALL_STEPS.each do |step|
        desc "Generate #{step.key}; Fal may charge (RUN=..., ONLY=..., FORCE=1)"
        task("gen:#{step.key}") { Operations.new.generate(step) }
        desc "Review #{step.key}; music review uses paid Whisper"
        task("review:#{step.key}") { step.new.review! }
      end
      task default: "pipeline:status"
    end
  end
end
