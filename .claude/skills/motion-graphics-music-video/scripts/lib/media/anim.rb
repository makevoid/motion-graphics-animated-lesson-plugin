require "json"
require_relative "shell"

module Media
  # Renders p5.js sketches to transparent PNG sequences with anim/render.mjs (headless Chrome via puppeteer-core).
  # The helper library the sketches use lives in anim/lib/; fonts in anim/fonts/.
  class Anim < Shell
    RENDER = File.expand_path("../../tools/p5/render.mjs", __dir__)

    # data: { name => json_path } is exposed to the sketch as Anim.data(name). only: [frame indices] for previews.
    # Returns the renderer's summary ({ "out", "frames", "width", "height", "fps", "ms" }).
    def render(sketch, out, width:, height:, fps:, frames:, data: {}, only: nil)
      args = [RENDER, sketch, "--out", out, "--width", width, "--height", height, "--fps", fps, "--frames", frames]
      args += ["--only", only.join(",")] if only
      data.each { |name, path| args += ["--data", "#{name}=#{path}"] }
      JSON.parse(run("node", *args).lines.last)
    end
  end
end
