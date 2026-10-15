// Transkodiert ein Video nach H.264/AAC (.mp4) mit festem Ziel-Bitrate —
// für lange Aufnahmen (Interviews), bei denen die AVAssetExportSession-
// Presets (export-video.swift) Dateien erzeugen, die größer als die Quelle
// und über dem 100-MB-Limit von GitHub liegen.
//
// Aufruf: swift export-video-bitrate.swift <input> <output.mp4> [videoKbps] [maxBreite]
//
//   videoKbps  Ziel-Bitrate Video in kbit/s, Standard 2500
//              (159 s Sprechkopf-Interview in 1080p ≈ 50 MB)
//   maxBreite  Ausgabe wird auf diese Breite skaliert, wenn die Quelle größer
//              ist, Standard 1920. Kleinere Quellen werden nicht vergrößert.
//
// Wie export-video.swift: kein DispatchSemaphore.wait() auf dem Hauptthread,
// der RunLoop läuft weiter, bis der Writer fertig ist (sonst stilles
// Deadlock in CLI-Tools).
import AVFoundation
import Foundation

let args = CommandLine.arguments
guard args.count >= 3 else {
    print("usage: swift export-video-bitrate.swift <input> <output.mp4> [videoKbps] [maxWidth]")
    exit(1)
}
let inputURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])
let videoKbps = args.count > 3 ? (Int(args[3]) ?? 2500) : 2500
let maxWidth = args.count > 4 ? (Int(args[4]) ?? 1920) : 1920
try? FileManager.default.removeItem(at: outputURL)

func fail(_ message: String) -> Never {
    print("FAILED: \(message)")
    exit(1)
}

let asset = AVURLAsset(url: inputURL)
guard let videoTrack = asset.tracks(withMediaType: .video).first else { fail("no video track") }
let audioTrack = asset.tracks(withMediaType: .audio).first

let natural = videoTrack.naturalSize.applying(videoTrack.preferredTransform)
let srcW = Int(abs(natural.width)), srcH = Int(abs(natural.height))
let scale = min(1.0, Double(maxWidth) / Double(srcW))
let outW = (Int(Double(srcW) * scale) / 2) * 2
let outH = (Int(Double(srcH) * scale) / 2) * 2

// Skalierung und evtl. Drehung (preferredTransform) über eine Video-Composition,
// damit hochkant aufgenommenes Material richtig herum landet.
let fps = videoTrack.nominalFrameRate > 0 ? videoTrack.nominalFrameRate : 30
let composition = AVMutableVideoComposition()
composition.renderSize = CGSize(width: outW, height: outH)
composition.frameDuration = CMTime(value: 1, timescale: CMTimeScale(fps.rounded()))
let instruction = AVMutableVideoCompositionInstruction()
instruction.timeRange = CMTimeRange(start: .zero, duration: asset.duration)
let layer = AVMutableVideoCompositionLayerInstruction(assetTrack: videoTrack)
layer.setTransform(
    videoTrack.preferredTransform.concatenating(CGAffineTransform(scaleX: scale, y: scale)),
    at: .zero
)
instruction.layerInstructions = [layer]
composition.instructions = [instruction]

let reader: AVAssetReader
let writer: AVAssetWriter
do {
    reader = try AVAssetReader(asset: asset)
    writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
} catch {
    fail(error.localizedDescription)
}

let videoOut = AVAssetReaderVideoCompositionOutput(
    videoTracks: [videoTrack],
    videoSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange]
)
videoOut.videoComposition = composition
reader.add(videoOut)

var audioOut: AVAssetReaderTrackOutput?
if let audioTrack = audioTrack {
    let out = AVAssetReaderTrackOutput(
        track: audioTrack,
        outputSettings: [AVFormatIDKey: kAudioFormatLinearPCM]
    )
    reader.add(out)
    audioOut = out
}

let videoIn = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: outW,
    AVVideoHeightKey: outH,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: videoKbps * 1000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoMaxKeyFrameIntervalKey: Int(fps.rounded()) * 2,
    ],
])
videoIn.expectsMediaDataInRealTime = false
writer.add(videoIn)

var audioIn: AVAssetWriterInput?
if audioOut != nil {
    let input = AVAssetWriterInput(mediaType: .audio, outputSettings: [
        AVFormatIDKey: kAudioFormatMPEG4AAC,
        AVNumberOfChannelsKey: 2,
        AVSampleRateKey: 44100,
        AVEncoderBitRateKey: 128_000,
    ])
    input.expectsMediaDataInRealTime = false
    writer.add(input)
    audioIn = input
}

writer.shouldOptimizeForNetworkUse = true
guard writer.startWriting() else { fail(writer.error?.localizedDescription ?? "startWriting") }
guard reader.startReading() else { fail(reader.error?.localizedDescription ?? "startReading") }
writer.startSession(atSourceTime: .zero)

let group = DispatchGroup()

func pump(_ input: AVAssetWriterInput, _ output: AVAssetReaderOutput, label: String) {
    group.enter()
    let queue = DispatchQueue(label: "export.\(label)")
    input.requestMediaDataWhenReady(on: queue) {
        while input.isReadyForMoreMediaData {
            if let sample = output.copyNextSampleBuffer() {
                if !input.append(sample) {
                    input.markAsFinished()
                    group.leave()
                    return
                }
            } else {
                input.markAsFinished()
                group.leave()
                return
            }
        }
    }
}

pump(videoIn, videoOut, label: "video")
if let audioIn = audioIn, let audioOut = audioOut {
    pump(audioIn, audioOut, label: "audio")
}

var finished = false
group.notify(queue: .main) {
    writer.finishWriting { finished = true }
}

let start = Date()
while !finished {
    RunLoop.current.run(mode: .default, before: Date(timeIntervalSinceNow: 0.2))
    if Date().timeIntervalSince(start) > 900 {
        fail("timeout after 900s (writer status \(writer.status.rawValue))")
    }
}

if writer.status == .completed {
    print("OK \(outW)x\(outH) @ \(videoKbps) kbit/s")
} else {
    fail(writer.error?.localizedDescription ?? "writer status \(writer.status.rawValue)")
}
