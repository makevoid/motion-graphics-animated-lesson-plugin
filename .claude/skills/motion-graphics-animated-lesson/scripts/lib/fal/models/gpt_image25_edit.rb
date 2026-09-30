require_relative "base"

module Fal
  module Models
    # https://fal.ai/models/openai/gpt-image-2.5/sunburst/edit — new frames of an existing character (keyframes).
    class GptImage25Edit < Base
      ENDPOINT = "openai/gpt-image-2.5/sunburst/edit".freeze
      DEFAULTS = { quality: "xhigh", output_format: "png", num_images: 1 }.freeze

      def edit(prompt:, image_urls:, aspect_ratio: "16:9", **opts)
        call(prompt: prompt, image_urls: image_urls, image_size: GptImage25::SIZES.fetch(aspect_ratio), **opts)
      end
    end
  end
end
