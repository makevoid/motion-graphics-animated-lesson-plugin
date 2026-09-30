$LOAD_PATH.unshift(__dir__)
require "uri"
Dir[File.join(__dir__, "media", "*.rb")].sort.each { |f| require f }
require "fal/client"
require "fal/openapi"
Dir[File.join(__dir__, "fal", "models", "*.rb")].sort.each { |f| require f }
require "pipeline/project"
require "pipeline/step"
require "pipeline/items_step"
Dir[File.join(__dir__, "pipeline", "steps", "*.rb")].sort.each { |f| require f }
module Pipeline
  DEFAULT_RUN = "s01"
  ALL_STEPS = [Steps::RefBase, Steps::RefTorn, Steps::Music, Steps::Keyframes,
               Steps::Video, Steps::Shots, Steps::Clips, Steps::Overlay].freeze
  def self.section(at, frames)
    raise ArgumentError, "at and frames must be integer frame counts" unless at.is_a?(Integer) && at >= 0 && frames.is_a?(Integer) && frames > 0
    { music_from: "audio/song.wav", music_offset: at / 24.0, frames: frames, lyrics: [] }
  end
  config = File.join(ROOT, "config", "generations.rb")
  GENERATIONS = File.exist?(config) ? module_eval(File.read(config), config).freeze : {}.freeze
end
