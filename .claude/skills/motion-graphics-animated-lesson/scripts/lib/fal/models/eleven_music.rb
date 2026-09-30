require_relative "base"

module Fal
  module Models
    # https://fal.ai/models/elevenlabs/music/v2.5: an instrumental music bed from a text prompt (Media::MusicBed loops it under the voice).
    class ElevenMusic < Base
      ENDPOINT = "elevenlabs/music/v2.5".freeze
      DEFAULTS = { output_format: "mp3_44100_192", force_instrumental: true }.freeze

      def compose(prompt:, **opts)
        call(prompt: prompt, **opts)
      end
    end
  end
end
