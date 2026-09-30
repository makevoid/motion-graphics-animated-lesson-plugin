require_relative "base"

module Fal
  module Models
    # https://fal.ai/models/fal-ai/nano-banana-2 (text-to-image)
    class NanoBanana2 < Base
      ENDPOINT = "fal-ai/nano-banana-2".freeze
      DEFAULTS = { output_format: "png", resolution: "2K", num_images: 1 }.freeze

      def generate(prompt:, aspect_ratio: "16:9", **opts)
        call(prompt: prompt, aspect_ratio: aspect_ratio, **opts)
      end
    end

    # https://fal.ai/models/fal-ai/nano-banana-2/edit (image editing w/ reference images)
    class NanoBanana2Edit < Base
      ENDPOINT = "fal-ai/nano-banana-2/edit".freeze
      DEFAULTS = { output_format: "png", resolution: "2K", num_images: 1 }.freeze

      def edit(prompt:, image_urls:, aspect_ratio: "auto", **opts)
        call(prompt: prompt, image_urls: Array(image_urls), aspect_ratio: aspect_ratio, **opts)
      end
    end
  end
end
