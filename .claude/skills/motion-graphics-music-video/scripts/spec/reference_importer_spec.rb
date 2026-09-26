require_relative "spec_helper"

RSpec.describe "Existing character reference import", :core do
  it "copies a proven reference without uploads and refuses conflicting identity bytes" do
    File.write(file("source.png"), "synthetic reference fixture")
    File.write(file("copy.png"), "synthetic reference fixture")
    json(file("manifest.json"), ref_base: { path: file("source.png"), url: "https://cdn.test/identity.png",
                                          request_id: "original-id", endpoint: "test/image" })
    run = "e2e-reference-#{Process.pid}-#{object_id}"
    importer = Pipeline::ReferenceImporter.new
    expect(Fal::Client).not_to receive(:new)
    result = importer.import(run: run, image: file("copy.png"), manifest: file("manifest.json"))
    expect(File.read(result["path"])).to eq("synthetic reference fixture")
    expect(result["url"]).to eq("https://cdn.test/identity.png")
    expect(result["provenance"][:sha256] || result["provenance"]["sha256"]).to eq(Digest::SHA256.file(file("source.png")).hexdigest)
    expect(importer.import(run: run, image: file("copy.png"), manifest: file("manifest.json"))["path"]).to eq(result["path"])
    File.write(file("copy.png"), "a different identity")
    expect { importer.import(run: run, image: file("copy.png"), manifest: file("manifest.json")) }.to raise_error(ArgumentError, /differ/)
  end
end
