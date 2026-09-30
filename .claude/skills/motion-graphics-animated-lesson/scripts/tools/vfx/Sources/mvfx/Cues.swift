import Foundation

// One effect hit, from the cue list lib/media/vfx.rb writes (prompts/run4-vfx/cues.yml, frame numbers on the video's 24fps grid).
//   f: the frame the effect hits (the beat), dur: frames it lasts from there, pre: frames of ramp-in before f.
//   shape: "hit" (full at f, decays to 0 over dur) or "span" (fades in over `fade` frames from f, holds, fades out by f + dur).
// Every other field is a per-effect knob with a default in Effects.swift. Cues with an fx this tool doesn't know
// (the p5 light layer's leak/flare/glints) are skipped here; their frames reach the video through --lights.
struct Cue: Decodable {
    let fx: String
    let f: Int
    let dur: Int
    var pre: Int?
    var shape: String?
    var fade: Int?
    var amt: Double?
    var radius: Double?
    var x: Double?
    var y: Double?
    var angle: Double?
    var color: String?
    var hold: Int?
    var seed: Int?
    var grain: Double?

    var first: Int { f - (pre ?? 0) }
    var last: Int { f + dur }
    func active(_ frame: Int) -> Bool { frame >= first && frame < last }

    // 0...1 strength of the cue at `frame`.
    func env(_ frame: Int, defaultShape: String = "hit", curve: Double = 2.2) -> Double {
        guard active(frame) else { return 0 }
        if frame < f {
            let q = Double(frame - first + 1) / Double((pre ?? 0) + 1)
            return q * q
        }
        let t = Double(frame - f)
        switch shape ?? defaultShape {
        case "span":
            let fd = Double(max(fade ?? 4, 1))
            return min(1, (t + 1) / fd, (Double(dur) - t) / fd)
        default:
            return pow(1 - t / Double(max(dur, 1)), curve)
        }
    }
}

struct CueFile: Decodable {
    let cues: [Cue]
}

// Deterministic per-frame randomness (SplitMix64), so a re-render gives the same jitter and glitch bands.
struct Rand {
    private var state: UInt64
    init(_ a: Int, _ b: Int = 0) { state = UInt64(bitPattern: Int64(a &* 73_856_093 ^ b &* 19_349_663)) &+ 0x9E37_79B9_7F4A_7C15 }
    mutating func next() -> Double {
        state &+= 0x9E37_79B9_7F4A_7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        z ^= z >> 31
        return Double(z >> 11) / Double(1 << 53)
    }
    mutating func range(_ lo: Double, _ hi: Double) -> Double { lo + (hi - lo) * next() }
    mutating func sign() -> Double { next() < 0.5 ? -1 : 1 }
}
