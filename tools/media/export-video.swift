// Transkodiert ein beliebiges Video (auch HEVC/4K/.mov) nach H.264/.mp4 —
// per AVFoundation, kein ffmpeg/Homebrew nötig, läuft mit Apple-Bordmitteln
// (VideoToolbox-Hardwarekodierung), fertig in Sekunden.
//
// Aufruf: swift export-video.swift <input> <output.mp4> [preset] [maxSeconds] [--mute]
//
//   preset      AVAssetExportSession-Preset, Standard 1920x1080.
//               Für Karussell-Vorschauen: 640x480 (~1–2 MB für 8 s).
//   maxSeconds  Nur die ersten N Sekunden exportieren (Vorschau-Clip).
//   --mute      Tonspur weglassen (Vorschau läuft ohnehin stumm).
//
// Wichtig: KEIN DispatchSemaphore.wait() auf dem Hauptthread — der
// Completion-Handler von AVAssetExportSession kommt über den Haupt-RunLoop.
// Ein blockierter Hauptthread erzeugt in reinen CLI-Tools (ohne App-RunLoop)
// ein stilles Deadlock, das ohne Timeout ewig hängt. Deshalb den RunLoop
// aktiv weiterlaufen lassen, bis der Callback feuert.
import AVFoundation
import Foundation

var args = CommandLine.arguments
let mute = args.contains("--mute")
args.removeAll { $0 == "--mute" }
guard args.count >= 3 else {
    print("usage: swift export-video.swift <input> <output.mp4> [preset] [maxSeconds] [--mute]")
    exit(1)
}
let inputURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])
let presetName = args.count > 3 ? "AVAssetExportPreset" + args[3] : AVAssetExportPreset1920x1080
let maxSeconds = args.count > 4 ? Double(args[4]) : nil
try? FileManager.default.removeItem(at: outputURL)

let source = AVURLAsset(url: inputURL)
var asset: AVAsset = source

if mute {
    // Nur die Videospur in eine Komposition kopieren — so entfällt die Tonspur
    // ohne Re-Encoding-Umweg.
    let comp = AVMutableComposition()
    guard let srcTrack = source.tracks(withMediaType: .video).first,
          let dstTrack = comp.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else {
        print("FAILED: no video track")
        exit(1)
    }
    do {
        try dstTrack.insertTimeRange(CMTimeRange(start: .zero, duration: source.duration), of: srcTrack, at: .zero)
    } catch {
        print("FAILED: \(error.localizedDescription)")
        exit(1)
    }
    dstTrack.preferredTransform = srcTrack.preferredTransform
    asset = comp
}

guard let exportSession = AVAssetExportSession(asset: asset, presetName: presetName) else {
    print("FAILED: no export session for preset \(presetName)")
    exit(1)
}
exportSession.outputURL = outputURL
exportSession.outputFileType = .mp4
exportSession.shouldOptimizeForNetworkUse = true
if let s = maxSeconds, s > 0 {
    exportSession.timeRange = CMTimeRange(start: .zero, duration: CMTime(seconds: s, preferredTimescale: 600))
}

var finished = false
exportSession.exportAsynchronously { finished = true }

let start = Date()
while !finished {
    RunLoop.current.run(mode: .default, before: Date(timeIntervalSinceNow: 0.1))
    if Date().timeIntervalSince(start) > 300 {
        print("FAILED: timeout after 300s, status=\(exportSession.status.rawValue) progress=\(exportSession.progress)")
        exit(1)
    }
}

switch exportSession.status {
case .completed:
    print("OK")
case .failed:
    print("FAILED: \(exportSession.error?.localizedDescription ?? "unknown")")
    exit(1)
default:
    print("STATUS: \(exportSession.status.rawValue)")
    exit(1)
}
