require "digest"
require "uri"

module Pipeline
  # Reuse an approved identity already hosted by its original generation provider.
  # This does not upload the local reference or generate a new image.
  class ReferenceImporter
    def import(run:, image:, manifest:)
      original = JSON.parse(File.read(manifest)).fetch("ref_base")
      source_path = File.expand_path(original.fetch("path"), File.dirname(File.expand_path(manifest)))
      digest = Digest::SHA256.file(image).hexdigest
      unless digest == Digest::SHA256.file(source_path).hexdigest
        raise ArgumentError, "Reference bytes differ from the source manifest image; cannot reuse its URL"
      end
      url = URI(original.fetch("url"))
      raise ArgumentError, "Reference manifest must contain an HTTPS URL" unless url.is_a?(URI::HTTPS)
      project = Project.new(run)
      if project[:ref_base]
        current = project[:ref_base]
        return current if File.file?(current.fetch("path")) && Digest::SHA256.file(current["path"]).hexdigest == digest && current["url"] == url.to_s
        raise ArgumentError, "RUN=#{run} already has a different identity; import into a new versioned RUN"
      end
      target = project.path("01_ref_base#{File.extname(image)}")
      FileUtils.cp(image, target)
      project.record(:ref_base, path: target, url: url.to_s, endpoint: original["endpoint"],
                     request_id: original["request_id"],
                     provenance: { source_manifest: File.expand_path(manifest), sha256: digest,
                                   reused_hosted_reference: true })
    end
  end
end
