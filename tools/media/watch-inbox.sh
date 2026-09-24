#!/bin/bash
# Beobachtet den Video-Eingang-Ordner und verarbeitet jede neue Datei
# automatisch — kein Terminal, kein Kommando von Hand. Wird von launchd
# über WatchPaths bei jeder Änderung im Ordner aufgerufen (siehe das
# LaunchAgent-plist, das dieses Skript einträgt).
#
# Was passiert pro neuer Datei:
#   1. Warten bis die Kopie fertig ist (Größe zwei Sekunden stabil)
#   2. Slug aus dem Dateinamen ableiten (slugify.py)
#   3. tools/media/add-video.sh: 1080p-Video, Vorschau-Clip, zwei Poster
#   4. add-draft-entry.py: Entwurfs-Eintrag in content/projekte.json
#      (draft:true — erscheint nirgends auf der Website, bis jemand Text
#      einträgt und draft auf false setzt)
#   5. Original nach Verarbeitet/ verschieben, macOS-Meldung anzeigen
set -uo pipefail

INBOX="$HOME/Desktop/Video für die Website"
ARCHIVE="$INBOX/Verarbeitet"
LOG="$INBOX/.verarbeitet.log"
ERRLOG="$INBOX/.fehler.log"
LOCK="$INBOX/.lock"
ROOT="/Users/lorendoren/Downloads/video website konstruktor"

mkdir -p "$INBOX" "$ARCHIVE"
touch "$LOG"

notify() {
  osascript -e "display notification \"$2\" with title \"$1\"" >/dev/null 2>&1 || true
}

# launchd kann mehrere Trigger kurz hintereinander feuern (z. B. bei einem
# langsamen Kopiervorgang) — ein zweiter, parallel laufender Durchgang soll
# dann einfach nichts tun statt dieselbe Datei doppelt anzufassen.
exec 9>"$LOCK"
flock -n 9 || exit 0

shopt -s nullglob nocaseglob
for f in "$INBOX"/*.mov "$INBOX"/*.mp4 "$INBOX"/*.m4v; do
  base="$(basename "$f")"
  grep -qxF "$base" "$LOG" 2>/dev/null && continue

  size1=$(stat -f%z "$f" 2>/dev/null || echo 0)
  sleep 2
  size2=$(stat -f%z "$f" 2>/dev/null || echo 0)
  if [ "$size1" != "$size2" ] || [ "$size1" = "0" ]; then
    continue   # noch am Kopieren/Schreiben — der nächste Trigger holt es
  fi

  slug="$(python3 "$ROOT/tools/media/slugify.py" "$base")"
  orig_slug="$slug"; n=1
  while [ -f "$ROOT/site-v1/assets/video/$slug.mp4" ]; do
    n=$((n + 1)); slug="${orig_slug}-${n}"
  done

  notify "Unique Films" "🎬 $base wird verarbeitet …"

  if "$ROOT/tools/media/add-video.sh" "$f" "$slug" \
     && python3 "$ROOT/tools/media/add-draft-entry.py" "$slug" "$base"; then
    echo "$base" >> "$LOG"
    mv "$f" "$ARCHIVE/$base"
    notify "Unique Films ✓" "Fertig: $slug — als Entwurf gespeichert, Text noch offen."
  else
    echo "$(date '+%Y-%m-%d %H:%M') $base" >> "$ERRLOG"
    notify "Unique Films ⚠️" "Fehler bei $base — siehe .fehler.log im Ordner."
  fi
done
