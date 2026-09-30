require_relative "spec_helper"
require_relative "../lib/toolkit/mcp_server"
require "stringio"
require "timeout"

RSpec.describe "Configured Fal credentials and MCP delivery", :core do
  def prepared_project
    project = file("video project")
    FileUtils.mkdir_p(File.join(project, "config"))
    json(File.join(project, "config/project.json"), fps: 24)
    project
  end

  def task_runner(api_key: "test-only-secret")
    entry = file("server/fixture.rb")
    FileUtils.mkdir_p(File.dirname(entry))
    File.write(entry, <<~'RUBY')
      require "json"
      require "digest"
      task = ARGV.last
      if ENV["RUN"] == "utf8"
        puts JSON.generate(encoding: Encoding.default_external.name,
          approval: JSON.parse(File.read("config/approval.json"))["user_approval"])
      end
      if ENV["RUN"] == "wait"
        $stdout.sync = true
        puts "waiting"
        sleep 30
      end
      puts JSON.generate(key_digest: Digest::SHA256.hexdigest(ENV.fetch("FAL_AI_API_KEY", "")), task: task, run: ENV["RUN"], cwd: Dir.pwd)
      exit 7 if ENV["RUN"] == "fail"
    RUBY
    @runner = Toolkit::CredentialTasks.new(entry: entry, api_key: api_key)
  end

  def wait_for_job(runner, id)
    Timeout.timeout(5) do
      loop do
        value = runner.status(id)
        return value unless value[:state] == "running"
        sleep 0.01
      end
    end
  end

  after { @runner&.close }

  it "uses only explicit credentials or FAL_AI_API_KEY, with no key-file lookup" do
    ENV.delete("FAL_AI_API_KEY")
    ENV["FAL_KEY"] = "obsolete-test-key"
    expect(File).not_to receive(:read)
    expect { Fal::Client.new }.to raise_error(Fal::Error, /Missing FAL_AI_API_KEY/)
    ENV["FAL_AI_API_KEY"] = "configured-test-key"
    expect { Fal::Client.new }.not_to raise_error
    ENV["FAL_AI_API_KEY"] = "  "
    expect { Fal::Client.new }.to raise_error(Fal::Error, /Missing FAL_AI_API_KEY/)
    expect { Fal::Client.new(api_key: "explicit-test-key") }.not_to raise_error
  end

  it "sends the configured value only to the toolkit child and preserves literal arguments" do
    ENV["RUN"] = "unrelated-parent-value"
    runner = task_runner
    project = prepared_project
    id = runner.start(project: project, task: "doctor")[:job_id]
    result = wait_for_job(runner, id)
    expect(result[:state]).to eq("completed")
    output = JSON.parse(result[:output])
    expect(output).to include("key_digest" => Digest::SHA256.hexdigest("test-only-secret"), "cwd" => project, "run" => nil)
    expect(result.to_json).not_to include("test-only-secret")
    expect(runner.redact("failure: test-only-secret")).to eq("failure: [REDACTED]")
  end

  it "rejects secret overrides, arbitrary tasks and uninitialized projects" do
    runner = task_runner
    project = prepared_project
    expect { runner.start(project: project, task: "doctor", options: {"FAL_AI_API_KEY" => "override"}) }.to raise_error(ArgumentError)
    expect { runner.start(project: project, task: "doctor; echo unexpected") }.to raise_error(ArgumentError)
    expect { runner.start(project: project, task: "setup") }.to raise_error(ArgumentError)
    expect { runner.start(project: fixtures, task: "doctor") }.to raise_error(ArgumentError)
    expect { runner.start(project: project, task: "doctor", options: {"RUN" => 2}) }.to raise_error(ArgumentError)
  end

  it "checks plan approval before passing the credential to an upload or generation task" do
    runner = task_runner
    project = prepared_project
    task = "media:upload[art with spaces.png]"
    expect { runner.start(project: project, task: task) }.to raise_error(/approval missing/i)
    FileUtils.mkdir_p(File.join(project, "docs"))
    File.write(File.join(project, "docs/PLAN.md"), "Mocked approval gate test")
    Workflow::Approval.new(root: project).record!("Test fixture consent")
    result = wait_for_job(runner, runner.start(project: project, task: task)[:job_id])
    expect(JSON.parse(result[:output])["task"]).to eq(task)
    File.write(File.join(project, "docs/PLAN.md"), "Changed")
    expect { runner.start(project: project, task: task) }.to raise_error(/Plan changed/)
  end

  it "reports missing configuration without exposing a placeholder as a real key" do
    runner = task_runner(api_key: "${user_config.FAL_AI_API_KEY}")
    expect(runner.configured?).to be(false)
    expect { runner.start(project: prepared_project, task: "gen:ref_base") }.to raise_error(/Configure the plugin/)
    result = wait_for_job(runner, runner.start(project: prepared_project, task: "doctor")[:job_id])
    expect(JSON.parse(result[:output])["key_digest"]).to eq(Digest::SHA256.hexdigest(""))
  end

  it "preserves UTF-8 approval, MCP arguments and worker output under a US-ASCII locale" do
    task_runner
    project = prepared_project + " — café"
    FileUtils.mv(prepared_project, project)
    FileUtils.mkdir_p(File.join(project, "docs"))
    File.write(File.join(project, "docs/PLAN.md"), "Bloom — 音楽", encoding: "UTF-8")
    note = "Approve wave 2 — café / 音楽"
    Workflow::Approval.new(root: project).record!(note)
    server = file("ascii_server.rb")
    File.write(server, <<~RUBY)
      require #{File.join(RT, "lib/toolkit/mcp_server").inspect}
      abort "Expected US-ASCII" unless Encoding.default_external == Encoding::US_ASCII
      tasks = Toolkit::CredentialTasks.new(entry: #{file("server/fixture.rb").inspect}, api_key: "fixture-only")
      Toolkit::McpServer.new(tasks: tasks).run
    RUBY
    task = "media:upload[art — café.png]"
    Open3.popen3({"LC_ALL" => "C", "LANG" => "C"}, RbConfig.ruby, "-EUS-ASCII", server) do |input, output, errors, waiter|
      rpc = lambda do |name, arguments|
        input.puts(JSON.generate(jsonrpc: "2.0", id: 1, method: "tools/call", params: {name: name, arguments: arguments}))
        input.flush
        response = JSON.parse(output.gets)
        expect(response).not_to have_key("error")
        expect(response.dig("result", "isError")).not_to be(true)
        JSON.parse(response.dig("result", "content", 0, "text"))
      end
      Timeout.timeout(5) do
        id = rpc.call("run_task", {project: project, task: task, options: {RUN: "utf8"}}).fetch("job_id")
        loop do
          result = rpc.call("task_status", {job_id: id})
          if result["state"] != "running"
            expect(result["state"]).to eq("completed")
            lines = result.fetch("output").lines.map { |line| JSON.parse(line) }
            expect(lines.first).to eq("encoding" => "UTF-8", "approval" => note)
            expect(lines.last).to include("task" => task, "cwd" => project)
            break
          end
          sleep 0.01
        end
      end
    ensure
      input.close unless input.closed?
      expect(errors.read).to eq("")
      expect(waiter.value.success?).to be(true)
    end
  end

  it "prefers the plugin option and falls back to an exported key when it is unset" do
    plugin = Toolkit::CredentialTasks::PLUGIN_KEY
    expect(Toolkit::CredentialTasks.env_key(plugin => "plugin-key", "FAL_AI_API_KEY" => "shell-key")).to eq("plugin-key")
    expect(Toolkit::CredentialTasks.env_key(plugin => "", "FAL_AI_API_KEY" => "shell-key")).to eq("shell-key")
    expect(Toolkit::CredentialTasks.env_key(plugin => "${user_config.FAL_AI_API_KEY}", "FAL_AI_API_KEY" => "shell-key")).to eq("shell-key")
    expect(Toolkit::CredentialTasks.env_key(plugin => "")).to eq("")
  end

  it "keeps simultaneous job options separate and reports task failure" do
    runner = task_runner
    project = prepared_project
    ids = %w[first fail].map { |run| runner.start(project: project, task: "doctor", options: {"RUN" => run})[:job_id] }
    results = ids.map { |id| wait_for_job(runner, id) }
    expect(results.map { |r| JSON.parse(r[:output])["run"] }).to eq(%w[first fail])
    expect(results.map { |r| r[:exit_code] }).to eq([0, 7])
    expect(results.last[:state]).to eq("failed")
  end

  it "cancels the local worker while explaining that submitted Fal work is separate" do
    runner = task_runner
    id = runner.start(project: prepared_project, task: "doctor", options: {"RUN" => "wait"})[:job_id]
    result = runner.cancel(id)
    expect(result[:state]).to eq("cancelled")
    expect(result[:note]).to include("may still run and incur charges")
  end

  it "speaks newline-delimited MCP and keeps credentials out of tool metadata and errors" do
    runner = task_runner
    messages = [
      {jsonrpc: "2.0", id: 1, method: "initialize", params: {protocolVersion: "2025-11-25"}},
      {jsonrpc: "2.0", method: "notifications/initialized"},
      {jsonrpc: "2.0", id: 2, method: "tools/list"},
      {jsonrpc: "2.0", id: 3, method: "tools/call", params: {name: "credential_status", arguments: {}}},
      {jsonrpc: "2.0", id: 4, method: "tools/call", params: {name: "task_status", arguments: {job_id: "unknown"}}}
    ]
    output = StringIO.new
    Toolkit::McpServer.new(input: StringIO.new(messages.map { |m| JSON.generate(m) }.join("\n") + "\n"), output: output, tasks: runner).run
    responses = output.string.lines.map { |line| JSON.parse(line) }
    expect(responses.map { |r| r["id"] }).to eq([1, 2, 3, 4])
    expect(responses.first.dig("result", "protocolVersion")).to eq("2025-11-25")
    expect(responses[1].dig("result", "tools").map { |t| t["name"] }).to include("run_task", "task_status")
    expect(JSON.parse(responses[2].dig("result", "content", 0, "text"))).to eq("configured" => true)
    expect(responses[3].dig("result", "isError")).to be(true)
    expect(output.string).not_to include("test-only-secret")
  end
end
