require_relative "base"

module Fal
  module Models
    # https://fal.ai/models/fal-ai/stable-audio-3/small/sfx/text-to-audio: short sound effects from a text prompt.
    class StableAudioSfx < Base
      ENDPOINT = "fal-ai/stable-audio-3/small/sfx/text-to-audio".freeze

      def generate(prompt:, **opts)
        call(prompt: prompt, **opts)
      end
    end
  end
end
