module Fal
  module Models
    # Base for a single fal endpoint. Subclasses set ENDPOINT and DEFAULTS
    # and expose an intention-revealing method (generate / edit / animate ...).
    class Base
      Result = Struct.new(:request_id, :input, :output, keyword_init: true)

      def self.endpoint = self::ENDPOINT
      def self.defaults = const_defined?(:DEFAULTS) ? self::DEFAULTS : {}

      attr_reader :client

      def initialize(client: Fal::Client.new)
        @client = client
      end

      def call(**input)
        input = self.class.defaults.merge(input).compact
        validate!(input)
        request_id, output = client.run(self.class.endpoint, input)
        Result.new(request_id: request_id, input: input, output: output)
      end

      private

      # Validate input against the fetched OpenAPI spec (rake openapi:fetch).
      def validate!(input)
        path = Fal::OpenAPI.spec_path(self.class.endpoint)
        return unless File.exist?(path)
        schema = Fal::OpenAPI.load(self.class.endpoint).input_schema
        props = schema["properties"] || {}
        missing = Array(schema["required"]).map(&:to_sym) - input.keys
        raise ArgumentError, "#{self.class.endpoint}: missing #{missing.join(", ")}" if missing.any?
        input.each do |key, value|
          prop = props[key.to_s] or raise ArgumentError, "#{self.class.endpoint}: unknown param #{key}"
          if prop["enum"] && !prop["enum"].include?(value)
            raise ArgumentError, "#{self.class.endpoint}: #{key}=#{value.inspect} not in #{prop["enum"].inspect}"
          end
          raise ArgumentError, "#{key} < #{prop["minimum"]}" if prop["minimum"] && value.is_a?(Numeric) && value < prop["minimum"]
          raise ArgumentError, "#{key} > #{prop["maximum"]}" if prop["maximum"] && value.is_a?(Numeric) && value > prop["maximum"]
        end
      end
    end
  end
end
