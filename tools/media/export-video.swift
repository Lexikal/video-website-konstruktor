// Transkodiert ein beliebiges Video (auch HEVC/4K/.mov) nach 1920x1080
// H.264/.mp4 — per AVFoundation, kein ffmpeg/Homebrew nötig, läuft mit
// Apple-Bordmitteln (VideoToolbox-Hardwarekodierung), fertig in Sekunden.
//
// Aufruf: swift export-video.swift <input> <output.mp4>
//
// Wichtig: KEIN DispatchSemaphore.wait() auf dem Hauptthread — der
// Completion-Handler von AVAssetExportSession kommt über den Haupt-RunLoop.
// Ein blockierter Hauptthread erzeugt in reinen CLI-Tools (ohne App-RunLoop)
// ein stilles Deadlock, das ohne Timeout ewig hängt. Deshalb den RunLoop
// aktiv weiterlaufen lassen, bis der Callback feuert.
import AVFoundation
import Foundation

let args = CommandLine.arguments
guard args.count >= 3 else {
    print("usage: swift export-video.swift <input> <output.mp4>")
    exit(1)
}
let inputURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])
try? FileManager.default.removeItem(at: outputURL)

let asset = AVURLAsset(url: inputURL)
guard let exportSession = AVAssetExportSession(asset: asset, presetName: AVAssetExportPreset1920x1080) else {
    print("FAILED: no export session")
    exit(1)
}
exportSession.outputURL = outputURL
exportSession.outputFileType = .mp4
exportSession.shouldOptimizeForNetworkUse = true

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
