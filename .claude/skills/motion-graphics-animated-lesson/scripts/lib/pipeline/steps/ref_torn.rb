module Pipeline
  module Steps
    # Step 2 — torn-paper reveal edit: colored illustration + line-art interiors
    # (nano-banana-2/edit, prompt = user YAML spec). This is the video's reference frame.
    class RefTorn < Step
      PREAMBLE = "Edit the provided reference image following this YAML specification exactly. " \
                 "Output one image with the same framing and aspect ratio as the reference. " \
                 "There must be exactly TWO separate torn-paper openings, each with visible ragged torn paper edges: " \
                 "one across the chest, and a second one across the lower abdomen / skirt waistband, with a band of the " \
                 "original colored illustration left intact between them. The face, the microphone and the hand holding it stay fully colored.\n\n".freeze

      MODEL = Fal::Models::NanoBanana2Edit

      def submit
        prompt = "#{PREAMBLE}```yaml\n#{project.prompt("02_ref_torn")}```"
        MODEL.new(client: client).edit(prompt: prompt, image_urls: [project.fetch!(:ref_base, :url)], seed: seed)
      end

      def materialize(result)
        image = result.output.fetch("images").first
        base_data(result).merge(url: image["url"], path: download(image["url"], "02_ref_torn.png"),
                                description: result.output["description"])
      end

      def review
        base, torn = project[:ref_base]["path"], project[key]["path"]
        base_info, torn_info = magick.identify(base), magick.identify(torn)
        split = python.style_split(base, torn)["images"]
        mono_gain = (split[1]["mono_pct"] - split[0]["mono_pct"]).round(1)
        board = magick.board([[base, "base (colored)"], [torn, "torn-paper reveal"]], project.review_path(key, "compare.jpg"))
        mask = magick.saturation_mask(torn, project.review_path(key, "mono_mask.png"))
        {
          base: base_info, torn: torn_info, style: { base: split[0], torn: split[1], mono_gain_pct: mono_gain },
          compare: board, mono_mask: mask,
          **verdict(
            "same framing" => [(base_info[:aspect] - torn_info[:aspect]).abs < 0.02, "#{base_info[:aspect]} vs #{torn_info[:aspect]}"],
            "line-art area added" => [mono_gain >= 8, "mono +#{mono_gain}% vs base"],
            "still half colored" => [split[1]["mono_pct"].between?(15, 70), "mono #{split[1]["mono_pct"]}%"]
          )
        }
      end
    end
  end
end
