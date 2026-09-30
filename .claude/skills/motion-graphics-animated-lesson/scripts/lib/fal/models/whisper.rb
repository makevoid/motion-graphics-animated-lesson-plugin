require_relative "base"

module Fal
  module Models
    # https://fal.ai/models/fal-ai/whisper — used in reviews to verify sung lyrics.
    class Whisper < Base
      ENDPOINT = "fal-ai/whisper".freeze
      DEFAULTS = { task: "transcribe", language: "en", chunk_level: "segment" }.freeze

      def transcribe(audio_url:, **opts)
        call(audio_url: audio_url, **opts)
      end
    end
  end
end
