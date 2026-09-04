#!/bin/bash
# Nimmt ein beliebiges Roh-Video und macht daraus web-taugliches Material
# im richtigen Ordner — ohne ffmpeg, ohne Homebrew, ohne Warten.
#
# Nutzung:
#   tools/media/add-video.sh <input-video> <slug> [poster-sekunde]
#
# Erzeugt:
#   site-v1/assets/video/<slug>.mp4   (1920x1080, H.264 — läuft in jedem Browser)
#   site-v1/assets/img/<slug>.jpg     (Poster-Frame, auf 1600px komprimiert)
#
# Trägt NICHTS in content/projekte.json ein — Titel/Text/Kategorie/Model-
# Release bleiben bewusst eine bewusste Entscheidung, kein Automatismus.
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "usage: $0 <input-video> <slug> [poster-sekunde]" >&2
  exit 1
fi

INPUT="$1"
SLUG="$2"
POSTER_SEC="${3:-1.5}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SITE="$ROOT/site-v1"
OUT_VIDEO="$SITE/assets/video/$SLUG.mp4"
OUT_POSTER="$SITE/assets/img/$SLUG.jpg"

if [ ! -f "$INPUT" ]; then
  echo "FEHLER: Datei nicht gefunden: $INPUT" >&2
  exit 1
fi

mkdir -p "$SITE/assets/video" "$SITE/assets/img"

echo "→ Video: $INPUT → $OUT_VIDEO (1080p/H.264)"
swift "$ROOT/tools/media/export-video.swift" "$INPUT" "$OUT_VIDEO"

echo "→ Poster: Frame bei ${POSTER_SEC}s → $OUT_POSTER"
swift "$ROOT/tools/media/export-poster.swift" "$INPUT" "$OUT_POSTER" "$POSTER_SEC"
sips -Z 1600 "$OUT_POSTER" --setProperty formatOptions 75 >/dev/null

VIDEO_SIZE=$(du -h "$OUT_VIDEO" | cut -f1)
POSTER_SIZE=$(du -h "$OUT_POSTER" | cut -f1)
echo "✓ Fertig: $VIDEO_SIZE Video, $POSTER_SIZE Poster."
echo ""
echo "In content/projekte.json für Slug '$SLUG' eintragen:"
echo "  \"video\": \"assets/video/$SLUG.mp4\","
echo "  \"poster\": \"assets/img/$SLUG.jpg\","
