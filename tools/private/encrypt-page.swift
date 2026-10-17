// Verschlüsselt einen HTML-Schnipsel für die interne Seite (site-v1/intern.html).
//
// Warum: die Website ist statisch auf GitHub Pages, das Repository ist
// öffentlich. Ein reiner "Code-Abfrage"-Schutz in JavaScript hielte den
// Inhalt trotzdem für jeden lesbar (Quelltext). Deshalb liegt im Repo nur der
// verschlüsselte Text; der Browser entschlüsselt ihn erst, wenn der richtige
// Code eingegeben wird (PBKDF2-SHA256 → AES-256-GCM, WebCrypto).
//
// Aufruf (Code per Umgebungsvariable, damit er nicht in der Shell-Historie
// oder im Prozessnamen auftaucht):
//   UF_CODE="xxxx-xxxx-xxxx-xxxx" swift tools/private/encrypt-page.swift \
//       private-src/discovery-guide.html site-v1/assets/intern/leitfaden.enc.json
//
// Der Klartext (private-src/) bleibt lokal und ist nicht in Git.
// Der Code wird wie im Browser normalisiert: Kleinbuchstaben, ohne Leer-
// zeichen und Bindestriche.
import CommonCrypto
import CryptoKit
import Foundation

let args = CommandLine.arguments
guard args.count == 3, let raw = ProcessInfo.processInfo.environment["UF_CODE"], !raw.isEmpty else {
    print("usage: UF_CODE=<code> swift encrypt-page.swift <klartext.html> <ausgabe.enc.json>")
    exit(1)
}
let code = raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    .replacingOccurrences(of: "-", with: "")
    .replacingOccurrences(of: " ", with: "")
let iterations = 600_000

guard let plain = FileManager.default.contents(atPath: args[1]) else {
    print("FAILED: Datei nicht lesbar: \(args[1])")
    exit(1)
}

var salt = Data(count: 16)
let rnd = salt.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, 16, $0.baseAddress!) }
guard rnd == errSecSuccess else { print("FAILED: kein Zufall"); exit(1) }

var keyBytes = Data(count: 32)
let pw = Array(code.utf8)
let status: Int32 = keyBytes.withUnsafeMutableBytes { keyPtr in
    salt.withUnsafeBytes { saltPtr in
        CCKeyDerivationPBKDF(
            CCPBKDFAlgorithm(kCCPBKDF2),
            pw.map { Int8(bitPattern: $0) }, pw.count,
            saltPtr.bindMemory(to: UInt8.self).baseAddress!, salt.count,
            CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256), UInt32(iterations),
            keyPtr.bindMemory(to: UInt8.self).baseAddress!, 32
        )
    }
}
guard status == kCCSuccess else { print("FAILED: PBKDF2 (\(status))"); exit(1) }

do {
    let box = try AES.GCM.seal(plain, using: SymmetricKey(data: keyBytes))
    let package: [String: Any] = [
        "v": 1,
        "kdf": "PBKDF2-SHA256",
        "iter": iterations,
        "salt": salt.base64EncodedString(),
        "iv": Data(box.nonce).base64EncodedString(),
        "ct": (box.ciphertext + box.tag).base64EncodedString(),
    ]
    let json = try JSONSerialization.data(withJSONObject: package, options: [.prettyPrinted, .sortedKeys])
    try json.write(to: URL(fileURLWithPath: args[2]))
    print("OK \(plain.count) Bytes -> \(args[2])")
} catch {
    print("FAILED: \(error)")
    exit(1)
}
