#!/usr/bin/env node
// Render a p5.js sketch to a transparent PNG sequence, frame-exact, in headless Chrome.
//
//   node anim/render.mjs <sketch.js> --out <dir> [--width 1928] [--height 1076] [--fps 24] [--frames 168]
//                        [--only 0,48,120] [--data name=file.json ...] [--chrome /path/to/chrome]
//
// The sketch registers itself with Anim.sketch({ load, draw }) (see anim/lib/core.js) and gets
// every anim/lib/*.js helper. Frame i is drawn at t = i / fps and written to <out>/<i:0000>.png.
// Prints a JSON summary ({ out, frames, width, height, fps, ms }) on stdout.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const LIB = ["core", "time", "fx", "type", "paper", "riso", "explainer"];
const CHROME = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium"
].filter(Boolean);
const TYPES = { ".js": "text/javascript", ".mjs": "text/javascript", ".ttf": "font/ttf", ".otf": "font/otf",
                ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".html": "text/html" };

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string" },
    width: { type: "string", default: "1928" },
    height: { type: "string", default: "1076" },
    fps: { type: "string", default: "24" },
    frames: { type: "string", default: "168" },
    only: { type: "string" },
    data: { type: "string", multiple: true, default: [] },
    chrome: { type: "string" }
  }
});
const sketch = positionals[0];
if (!sketch || !opts.out) {
  console.error("usage: node anim/render.mjs <sketch.js> --out <dir> [--width W --height H --fps N --frames N --only 0,12 --data name=file.json]");
  process.exit(2);
}

const cfg = {
  width: +opts.width, height: +opts.height, fps: +opts.fps, frames: +opts.frames,
  data: Object.fromEntries(opts.data.map((kv) => {
    const [name, file] = kv.split("=");
    return [name, JSON.parse(fs.readFileSync(file, "utf8"))];
  }))
};
const indices = opts.only ? opts.only.split(",").map(Number) : [...Array(cfg.frames).keys()];
const sketchUrl = "/" + path.relative(ROOT, path.resolve(sketch)).split(path.sep).join("/");
if (sketchUrl.startsWith("/..")) throw new Error(`sketch must live inside ${ROOT}`);

const page = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;background:transparent}</style>
<script>window.ANIM = ${JSON.stringify({ ...cfg, frame: 0, t: 0, ready: false })};</script>
<script src="/node_modules/p5/lib/p5.min.js"></script>
${LIB.map((m) => `<script src="/tools/p5/lib/${m}.js"></script>`).join("\n")}
<script src="${sketchUrl}"></script>
</head><body></body></html>`;

// Static server rooted at the video project for p5, tools/p5/lib, selected tools/p5/fonts and sketches.
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (url === "/__anim__.html") return res.writeHead(200, { "content-type": "text/html" }).end(page);
  if (url === "/favicon.ico") return res.writeHead(204).end();
  const file = path.join(ROOT, url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));

const executablePath = opts.chrome || CHROME.find((p) => fs.existsSync(p));
if (!executablePath) throw new Error("no Chrome found, pass --chrome or set CHROME_PATH");
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--force-color-profile=srgb"] });
const started = Date.now();
try {
  const tab = await browser.newPage();
  const errors = [];
  tab.on("pageerror", (e) => errors.push(e.message));
  tab.on("console", (m) => m.type() === "error" && !m.text().startsWith("Failed to load resource") && errors.push(m.text()));
  tab.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  await tab.setViewport({ width: cfg.width, height: cfg.height, deviceScaleFactor: 1 });
  await tab.goto(`http://127.0.0.1:${server.address().port}/__anim__.html`);
  await tab.waitForFunction("window.ANIM.ready || window.ANIM.error", { timeout: 60_000 }).catch(() => {});
  const state = await tab.evaluate(() => ({ ready: ANIM.ready, error: ANIM.error }));
  if (!state.ready) throw new Error(`sketch did not start: ${state.error || errors.join("\n") || "timeout"}`);

  fs.mkdirSync(opts.out, { recursive: true });
  for (const i of indices) {
    const dataUrl = await tab.evaluate((i) => Anim.renderFrame(i), i);
    if (errors.length) throw new Error(`frame ${i}: ${errors.join("\n")}`);
    fs.writeFileSync(path.join(opts.out, `${String(i).padStart(4, "0")}.png`), Buffer.from(dataUrl.split(",")[1], "base64"));
    if (process.stderr.isTTY) process.stderr.write(`\rframe ${i + 1}/${cfg.frames}`);
  }
  if (process.stderr.isTTY) process.stderr.write("\n");
  console.log(JSON.stringify({ out: opts.out, frames: indices.length, width: cfg.width, height: cfg.height, fps: cfg.fps, ms: Date.now() - started }));
} finally {
  await browser.close();
  server.close();
}
