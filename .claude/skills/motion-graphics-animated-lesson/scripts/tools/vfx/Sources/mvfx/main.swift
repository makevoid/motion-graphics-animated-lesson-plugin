import CoreImage
import Foundation
import ImageIO
import UniformTypeIdentifiers

// mvfx: post-processing VFX over a finished video, frame-exact on its 24fps grid.
//
//   mvfx --in video.mp4 --cues cues.json --out out.mp4 [--lights dir] [--from N --to M]
//   mvfx --in video.mp4 --cues cues.json --stills dir --only 120,503,1296 [--lights dir]
//
// Frames come from ffmpeg as raw BGRA and go back to ffmpeg (libx264 crf 16, the source's audio copied or cut to the range),
// with accurate swscale rounding both ways, so an empty cue list is a clean re-encode (same colour means as the source). The effects themselves are Core Image (Effects.swift) on the GPU. --lights: a dir of transparent PNGs named by
// frame (0503.png), screen-blended over the frame (the p5 light layer: leaks, flares, glints); missing files mean no light.
// --stills writes <dir>/<frame>.png for the --only frames instead of a video.

struct Options {
    var input = "", cues = "", out = "", lights: String?, stills: String?
    var only: [Int] = []
    var from = 0, to: Int?

    init(_ args: [String]) {
        var it = args.dropFirst().makeIterator()
        while let a = it.next() {
            let v = it.next() ?? ""
            switch a {
            case "--in": input = v
            case "--cues": cues = v
            case "--out": out = v
            case "--lights": lights = v
            case "--stills": stills = v
            case "--only": only = v.split(separator: ",").compactMap { Int($0) }.sorted()
            case "--from": from = Int(v) ?? 0
            case "--to": to = Int(v)
            default: fail("unknown option \(a)")
            }
        }
        if input.isEmpty || cues.isEmpty || (out.isEmpty && stills == nil) {
            fail("usage: mvfx --in video.mp4 --cues cues.json (--out out.mp4 [--from N --to M] | --stills dir --only 1,2) [--lights dir]")
        }
    }
}

func fail(_ msg: String) -> Never {
    FileHandle.standardError.write((msg + "\n").data(using: .utf8)!)
    exit(1)
}

func probe(_ path: String) -> (w: Int, h: Int, frames: Int) {
    let p = Process()
    p.executableURL = URL(fileURLWithPath: "/usr/bin/env")
    p.arguments = ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets",
                   "-show_entries", "stream=width,height,nb_read_packets", "-of", "csv=p=0", path]
    let pipe = Pipe()
    p.standardOutput = pipe
    try! p.run()
    p.waitUntilExit()
    let s = String(data: pipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8)!
    let v = s.trimmingCharacters(in: .whitespacesAndNewlines).split(separator: ",").compactMap { Int($0) }
    guard v.count == 3 else { fail("ffprobe failed on \(path): \(s)") }
    return (v[0], v[1], v[2])
}

func ffmpeg(_ args: [String], stdin: Pipe? = nil, stdout: Pipe? = nil) -> Process {
    let p = Process()
    p.executableURL = URL(fileURLWithPath: "/usr/bin/env")
    p.arguments = ["ffmpeg", "-hide_banner", "-v", "error"] + args
    if let stdin { p.standardInput = stdin }
    if let stdout { p.standardOutput = stdout }
    do { try p.run() } catch { fail("ffmpeg: \(error)") }
    return p
}

// Fill `buf` with exactly `n` bytes from a pipe (false at EOF). POSIX read into one reused buffer: no per-frame Data.
func readFull(_ fd: Int32, _ buf: UnsafeMutableRawPointer, _ n: Int) -> Bool {
    var got = 0
    while got < n {
        let r = read(fd, buf + got, n - got)
        if r <= 0 { return false }
        got += r
    }
    return true
}

func writeFull(_ fd: Int32, _ buf: UnsafeRawPointer, _ n: Int) {
    var put = 0
    while put < n {
        let r = write(fd, buf + put, n - put)
        if r <= 0 { fail("encoder pipe closed") }
        put += r
    }
}

func writePNG(_ bytes: Data, w: Int, h: Int, to path: String) {
    let provider = CGDataProvider(data: bytes as CFData)!
    let info = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)
    let img = CGImage(width: w, height: h, bitsPerComponent: 8, bitsPerPixel: 32, bytesPerRow: w * 4,
                      space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: info, provider: provider,
                      decode: nil, shouldInterpolate: false, intent: .defaultIntent)!
    let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(dest, img, nil)
    CGImageDestinationFinalize(dest)
}

let opt = Options(CommandLine.arguments)
let cues: [Cue]
do {
    cues = try JSONDecoder().decode(CueFile.self, from: Data(contentsOf: URL(fileURLWithPath: opt.cues))).cues
} catch { fail("cues \(opt.cues): \(error)") }

let (W, H, total) = probe(opt.input)
let fps = 24.0
let last = min(opt.to ?? total, total)
let frameBytes = W * H * 4
let fx = Effects(width: W, height: H)
let ctx = CIContext(options: [.workingColorSpace: NSNull(), .outputColorSpace: NSNull(), .cacheIntermediates: false])

// Which source frames we need, in order.
let wanted: [Int] = opt.stills != nil ? opt.only.filter { $0 < total } : Array(opt.from..<last)
guard !wanted.isEmpty else { fail("no frames to render") }
let select = opt.stills != nil
    ? "select='\(wanted.map { "eq(n\\,\($0))" }.joined(separator: "+"))'"
    : "trim=start_frame=\(opt.from):end_frame=\(last),setpts=PTS-STARTPTS"

// swscale's default rounding darkens a yuv -> rgb -> yuv round trip by ~1.5 levels; these flags make it lossless on average.
let sws = "scale=flags=accurate_rnd+full_chroma_int+full_chroma_inp"
let decOut = Pipe()
let decoder = ffmpeg(["-i", opt.input, "-vf", "\(select),\(sws),format=bgra", "-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", "bgra", "pipe:1"],
                     stdout: decOut)

var encoder: Process?
let encIn = Pipe()
if opt.stills == nil {
    let t0 = Double(opt.from) / fps, len = Double(last - opt.from) / fps
    let whole = opt.from == 0 && last == total
    let audio = whole ? ["-i", opt.input] : ["-ss", String(format: "%.4f", t0), "-t", String(format: "%.4f", len), "-i", opt.input]
    encoder = ffmpeg(["-y", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", "\(W)x\(H)", "-r", "24", "-i", "pipe:0"] + audio +
                     ["-map", "0:v:0", "-map", "1:a:0?", "-vf", "\(sws),format=yuv420p", "-c:v", "libx264", "-crf", "16", "-preset", "medium",
                      "-r", "24"] + (whole ? ["-c:a", "copy"] : ["-c:a", "aac", "-b:a", "256k"]) + [opt.out], stdin: encIn)
} else {
    try? FileManager.default.createDirectory(atPath: opt.stills!, withIntermediateDirectories: true)
}

// Memory stays flat (~1–2 GB): one input and one output frame buffer are reused, and each frame's Core Image graph, the lights PNG and
// every Foundation object it touches are released at the end of the frame (autoreleasepool). Without the pool a top-level loop
// never drains, and the full 3397-frame song grew to ~40 GB.
let started = Date()
let inBuf = UnsafeMutableRawPointer.allocate(byteCount: frameBytes, alignment: 64)
let outBuf = UnsafeMutableRawPointer.allocate(byteCount: frameBytes, alignment: 64)
let inFd = decOut.fileHandleForReading.fileDescriptor
let outFd = encIn.fileHandleForWriting.fileDescriptor
signal(SIGPIPE, SIG_IGN)
for (i, frame) in wanted.enumerated() {
    autoreleasepool {
        guard readFull(inFd, inBuf, frameBytes) else { fail("decoder ended at frame \(frame)") }
        let bytes = Data(bytesNoCopy: inBuf, count: frameBytes, deallocator: .none)   // render is synchronous, so reusing inBuf is safe
        let src = CIImage(bitmapData: bytes, bytesPerRow: W * 4, size: CGSize(width: W, height: H), format: .BGRA8, colorSpace: nil)
        let name = String(format: "%04d.png", frame)
        var lights: CIImage?
        if let dir = opt.lights, FileManager.default.fileExists(atPath: "\(dir)/\(name)") {
            lights = CIImage(contentsOf: URL(fileURLWithPath: "\(dir)/\(name)"), options: [.colorSpace: NSNull()])
        }
        let img = fx.apply(src, frame: frame, cues: cues, lights: lights)
        ctx.render(img, toBitmap: outBuf, rowBytes: W * 4, bounds: fx.extent, format: .BGRA8, colorSpace: nil)
        if let dir = opt.stills {
            writePNG(Data(bytes: outBuf, count: frameBytes), w: W, h: H, to: "\(dir)/\(name)")
        } else {
            writeFull(outFd, outBuf, frameBytes)
        }
        if i % 240 == 239 { ctx.clearCaches() }
        if isatty(2) != 0, i % 24 == 0 {
            FileHandle.standardError.write("\rframe \(i + 1)/\(wanted.count)".data(using: .utf8)!)
        }
    }
}
try? encIn.fileHandleForWriting.close()
decoder.waitUntilExit()
encoder?.waitUntilExit()
if let e = encoder, e.terminationStatus != 0 { fail("encoder failed (\(e.terminationStatus))") }
if isatty(2) != 0 { FileHandle.standardError.write("\n".data(using: .utf8)!) }
let ms = Int(Date().timeIntervalSince(started) * 1000)
print("{\"out\":\"\(opt.stills ?? opt.out)\",\"frames\":\(wanted.count),\"width\":\(W),\"height\":\(H),\"ms\":\(ms)}")
