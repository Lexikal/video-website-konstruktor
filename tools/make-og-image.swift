// Erzeugt site-v1/assets/img/og.jpg (1200x630) — das Vorschaubild beim Teilen
// eines Links (WhatsApp, LinkedIn, Instagram-Bio, E-Mail).
//
// Ausführen aus dem Projektstamm:
//   swift tools/make-og-image.swift
//
// Bewusst ohne {{NAME}}/{{STADT}}: solange dort Platzhalter stehen, sähe das
// geteilte Vorschaubild kaputt aus. Sobald der echte Name feststeht, hier
// ergänzen und neu erzeugen. Später kann das Textbild durch ein echtes
// Filmstill ersetzt werden — dann diese Datei entsprechend anpassen.

import AppKit
import Foundation

let W = 1200, H = 630
let ink      = NSColor(srgbRed: 0.043, green: 0.043, blue: 0.051, alpha: 1) // #0B0B0D
let paper    = NSColor(srgbRed: 0.929, green: 0.918, blue: 0.894, alpha: 1) // #EDEAE4
let muted    = NSColor(srgbRed: 0.569, green: 0.549, blue: 0.522, alpha: 1) // #918C85
let warm     = NSColor(srgbRed: 1.000, green: 0.620, blue: 0.302, alpha: 1) // #FF9E4D Tungsten
let cool     = NSColor(srgbRed: 0.357, green: 0.659, blue: 0.851, alpha: 1) // #5BA8D9 Tageslicht

guard let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: W, pixelsHigh: H,
                                bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                                isPlanar: false, colorSpaceName: .deviceRGB,
                                bytesPerRow: 0, bitsPerPixel: 0),
      let ctx = NSGraphicsContext(bitmapImageRep: rep) else {
    FileHandle.standardError.write("Bitmap-Kontext fehlgeschlagen\n".data(using: .utf8)!)
    exit(1)
}
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = ctx

// Hintergrund
ink.setFill()
NSRect(x: 0, y: 0, width: W, height: H).fill()

let display = NSFont(name: "HelveticaNeue-Bold", size: 78) ?? NSFont.boldSystemFont(ofSize: 78)
let mono    = NSFont(name: "Menlo-Regular", size: 18) ?? NSFont.monospacedSystemFont(ofSize: 18, weight: .regular)

/// Zeichnet eine Headline-Zeile; `accent` färbt genau ein Wort ein.
func headline(_ text: String, y: CGFloat, accentWord: String? = nil, accent: NSColor = warm) {
    let s = NSMutableAttributedString(string: text, attributes: [
        .font: display, .foregroundColor: paper, .kern: -2.5
    ])
    if let word = accentWord, let r = text.range(of: word) {
        s.addAttribute(.foregroundColor, value: accent, range: NSRange(r, in: text))
    }
    s.draw(at: NSPoint(x: 80, y: y))
}

// Positionierung von unten (unflipped context)
headline("GEDREHT, WO ES ECHT",  y: 372, accentWord: "ECHT", accent: warm)
headline("SEIN MUSS.",           y: 298)
headline("ERZEUGT, WO ES",       y: 224)
headline("UNMÖGLICH IST.",       y: 150, accentWord: "UNMÖGLICH", accent: cool)

// Kicker mit Strich davor
muted.setStroke()
let rule = NSBezierPath()
rule.move(to: NSPoint(x: 80, y: 536))
rule.line(to: NSPoint(x: 124, y: 536))
rule.lineWidth = 1
rule.stroke()
NSAttributedString(string: "FASHION · BEAUTY · MARKE", attributes: [
    .font: mono, .foregroundColor: muted, .kern: 4
]).draw(at: NSPoint(x: 142, y: 528))

// Fußzeile
NSAttributedString(string: "FILM   FOTOGRAFIE   REAL + GENERATIV", attributes: [
    .font: mono, .foregroundColor: muted, .kern: 3
]).draw(at: NSPoint(x: 80, y: 62))

// Temperaturskala: warm = gedreht, kalt = erzeugt — dieselbe Aussage wie im Interface
if let grad = NSGradient(starting: warm, ending: cool) {
    grad.draw(in: NSRect(x: 840, y: 66, width: 280, height: 4), angle: 0)
}

NSGraphicsContext.restoreGraphicsState()

let out = URL(fileURLWithPath: "site-v1/assets/img/og.jpg")
guard let data = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.86]) else {
    FileHandle.standardError.write("JPEG-Kodierung fehlgeschlagen\n".data(using: .utf8)!)
    exit(1)
}
try data.write(to: out)
print("geschrieben: \(out.path) (\(W)x\(H), \(data.count / 1024) KB)")
