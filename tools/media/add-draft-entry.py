#!/usr/bin/env python3
"""Hängt einen Entwurfs-Eintrag für ein neues Video an content/projekte.json.

draft:true + showcase:false → taucht auf der Website nirgends auf (kein
Platzhalter, keine Seite), bis jemand Text einträgt und draft auf false
setzt. Der Build (tools/build-projects.py) bricht bei kaputtem JSON ab —
deshalb hier defensiv: bei jedem Fehler unverändert lassen und laut melden.

Aufruf: python3 add-draft-entry.py <slug> <original-dateiname>
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
DATA = ROOT / "content" / "projekte.json"


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: add-draft-entry.py <slug> <original-dateiname>")
    slug, original = sys.argv[1], sys.argv[2]

    data = json.loads(DATA.read_text(encoding="utf-8"))
    if any(p.get("slug") == slug for p in data["projekte"]):
        sys.exit(f"FEHLER: slug '{slug}' existiert bereits in projekte.json")

    hinweis = f"[NEU aus Inbox: {original} — Text/Kategorie ausfüllen, dann draft:false]"
    entry = {
        "slug": slug,
        "draft": True,
        "showcase": False,
        "featured": False,
        "jahr": "",
        "mode": "real",
        "typ": "Personal Project",
        "orientation": "landscape",
        "kunde": "",
        "video": f"assets/video/{slug}.mp4",
        "poster": f"assets/img/{slug}.jpg",
        "stills": [],
        "de": {"titel": hinweis, "kategorie": "", "rolle": "",
               "aufgabe": "", "ansatz": "", "ergebnis": ""},
        "en": {"titel": hinweis, "kategorie": "", "rolle": "",
               "aufgabe": "", "ansatz": "", "ergebnis": ""},
    }
    data["projekte"].append(entry)
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK: Entwurf '{slug}' in projekte.json angehängt.")


if __name__ == "__main__":
    main()
