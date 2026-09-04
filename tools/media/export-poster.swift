// Zieht einen einzelnen Frame aus einem Video als JPEG — für Video-Poster
// und Stills. Per AVFoundation, kein ffmpeg nötig.
//
// Aufruf: swift export-poster.swift <input> <output.jpg> <sekunde>
import AVFoundation
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count >= 4 else {
    print("usage: swift export-poster.swift <input> <output.jpg> <seconds>")
    exit(1)
}
let inputURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])
let seconds = Double(args[3]) ?? 1.0

let asset = AVURLAsset(url: inputURL)
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true

let time = CMTime(seconds: seconds, preferredTimescale: 600)
do {
    let cgImage = try gen.copyCGImage(at: time, actualTime: nil)
    guard let dest = CGImageDestinationCreateWithURL(outputURL as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {
        print("FAILED: no destination")
        exit(1)
    }
    CGImageDestinationAddImage(dest, cgImage, [kCGImageDestinationLossyCompressionQuality: 0.85] as CFDictionary)
    if CGImageDestinationFinalize(dest) {
        print("OK")
    } else {
        print("FAILED: finalize")
        exit(1)
    }
} catch {
    print("FAILED: \(error.localizedDescription)")
    exit(1)
}
