require "excon"
require "json"
require "fileutils"

module Fal
  # Fetches and summarizes fal queue OpenAPI specs:
  #   https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=<id>
  class OpenAPI
    BASE = "https://fal.ai/api/openapi/queue/openapi.json".freeze

    attr_reader :endpoint_id, :spec

    def self.spec_path(endpoint_id, dir: "specs")
      File.join(dir, "#{endpoint_id.tr("/", "_")}.json")
    end

    def self.fetch(endpoint_id, dir: "specs")
      resp = Excon.get(BASE, query: { endpoint_id: endpoint_id })
      raise Error, "OpenAPI fetch failed for #{endpoint_id}: HTTP #{resp.status}" unless resp.status == 200
      FileUtils.mkdir_p(dir)
      File.write(spec_path(endpoint_id, dir: dir), JSON.pretty_generate(JSON.parse(resp.body)))
      load(endpoint_id, dir: dir)
    end

    def self.load(endpoint_id, dir: "specs")
      new(endpoint_id, JSON.parse(File.read(spec_path(endpoint_id, dir: dir))))
    end

    def initialize(endpoint_id, spec)
      @endpoint_id = endpoint_id
      @spec = spec
    end

    def schemas
      spec.dig("components", "schemas") || {}
    end

    def input_schema
      schemas.find { |name, _| name.end_with?("Input") }&.last || {}
    end

    def output_schema
      schemas.find { |name, _| name.end_with?("Output") }&.last || {}
    end

    # Human-readable summary of input params (name, type, default, enum, required).
    def summary
      required = Array(input_schema["required"])
      lines = ["# #{endpoint_id}", "## input"]
      (input_schema["properties"] || {}).each do |name, prop|
        type = prop["type"] || prop["anyOf"]&.map { |t| t["type"] || t["$ref"]&.split("/")&.last }&.join("|") || prop["$ref"]&.split("/")&.last || prop.dig("allOf", 0, "$ref")&.split("/")&.last
        enum = prop["enum"] ? " enum=#{prop["enum"].inspect}" : ""
        dflt = prop.key?("default") ? " default=#{prop["default"].inspect}" : ""
        range = [prop["minimum"] && "min=#{prop["minimum"]}", prop["maximum"] && "max=#{prop["maximum"]}"].compact.join(" ")
        lines << "- #{name}#{required.include?(name) ? "*" : ""} (#{type})#{enum}#{dflt} #{range}".rstrip
        lines << "    #{prop["description"].to_s.gsub(/\s+/, " ")[0, 220]}" if prop["description"]
      end
      lines << "## output"
      (output_schema["properties"] || {}).each { |name, prop| lines << "- #{name} (#{prop["type"] || prop["$ref"]&.split("/")&.last || "object"})" }
      lines.join("\n")
    end
  end
end
