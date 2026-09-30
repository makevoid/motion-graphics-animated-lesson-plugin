#!/usr/bin/env ruby
# Start without Bundler so the plugin can connect before a video project is set up.
require_relative "lib/toolkit/mcp_server"
Toolkit::McpServer.new.run if $PROGRAM_NAME == __FILE__
