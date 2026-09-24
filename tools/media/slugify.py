#!/usr/bin/env python3
"""Dateiname -> URL-tauglicher Slug. Transliteriert Kyrillisch, entfernt den
Rest. Wird vom Inbox-Watcher aufgerufen, kein Nutzer-Input nötig.

Aufruf: python3 slugify.py "<Dateiname ohne Pfad>"
"""
import datetime
import pathlib
import re
import sys

# Vereinfachte Transliteration (GOST-nah) — reicht für Dateinamen, keine
# Ansprüche auf wissenschaftliche Korrektheit.
CYR = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "h", "ц": "c", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "",
    "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}


def slugify(name):
    stem = pathlib.Path(name).stem.lower()
    out = "".join(CYR.get(ch, ch) for ch in stem)
    out = re.sub(r"[^a-z0-9]+", "-", out).strip("-")
    out = re.sub(r"-{2,}", "-", out)
    if not out:
        out = "video-" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    return out


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: slugify.py <filename>")
    print(slugify(sys.argv[1]))
