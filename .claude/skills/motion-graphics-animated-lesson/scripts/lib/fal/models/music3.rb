require_relative "base"

module Fal
  module Models
    # https://fal.ai/models/minimax/music-3
    class Music3 < Base
      ENDPOINT = "minimax/music-3".freeze
      DEFAULTS = { num_inference_steps: 30, guidance_scale: 1.7 }.freeze

      def compose(prompt:, lyrics:, duration:, **opts)
        call(prompt: prompt, lyrics: lyrics, duration: duration, **opts)
      end
    end
  end
end
