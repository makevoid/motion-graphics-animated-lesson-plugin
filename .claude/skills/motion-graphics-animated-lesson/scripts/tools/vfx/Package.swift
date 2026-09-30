// swift-tools-version:5.9
// mvfx: post-processing VFX for the finished music video (zooms, glow, motion blur, edge blur, old TV, interference, flashes)
// with Core Image + AVFoundation, driven by a cue list (see prompts/run4-vfx/cues.yml and lib/media/vfx.rb).
import PackageDescription

let package = Package(
    name: "mvfx",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(name: "mvfx", path: "Sources/mvfx")
    ]
)
