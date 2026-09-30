require_relative "base"

module Fal
  module Models
    # https://fal.ai/models/elevenlabs/tts/eleven-v4: one narration line (text with optional [audio tags]) in a preset voice.
    # timestamps: true returns character-level alignment, which Media::Narration shifts onto the master timeline for p5 cues.
    class ElevenTts < Base
      ENDPOINT = "elevenlabs/tts/eleven-v4".freeze
      DEFAULTS = { output_format: "mp3_44100_192", timestamps: true }.freeze

      def speak(text:, voice:, **opts)
        call(text: text, voice: voice, **opts)
      end
    end
  end
end
