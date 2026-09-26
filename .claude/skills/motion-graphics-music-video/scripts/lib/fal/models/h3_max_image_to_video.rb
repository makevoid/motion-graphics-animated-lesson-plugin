require_relative "base"

module Fal
  module Models
    # https://fal.ai/models/minimax/h3-max/image-to-video
    class H3MaxImageToVideo < Base
      ENDPOINT = "minimax/h3-max/image-to-video".freeze
      DEFAULTS = { resolution: "1080P", prompt_expansion_mode: "disabled", enable_safety_checker: true }.freeze

      def animate(prompt:, image_url:, duration:, target_audio_url: nil, **opts)
        call(prompt: prompt, image_url: image_url, duration: duration, target_audio_url: target_audio_url, **opts)
      end
    end
  end
end
