#!/usr/bin/env bash
# ============================================
# STUDIO CHENILLE — Hero video → scroll-scrub frames
#
# Converts the Seedance hero video(s) into WebP frame sequences that
# js/hero-journey.js scrubs on scroll. The hero switches from zoom mode
# to video mode automatically once images/hero/manifest.json exists.
#
# Usage:
#   bash tools/hero-video-to-frames.sh desktop-16x9.mp4 [mobile-9x16.mp4]
#
# Desktop frames land in images/hero/frames/ (1280 wide, ~168 max).
# The optional portrait video builds images/hero/frames-mobile/
# (720 wide, ~108 max) — without it, phones keep the zoom-mode hero
# (16:9 frames would over-crop on a portrait screen).
#
# Finale dissolve targets (hero-layer index in index.html):
#   desktop → layer 0 (showhome-living), mobile → layer 1 (kitchen)
# ============================================
set -euo pipefail

DESKTOP="${1:?Usage: bash tools/hero-video-to-frames.sh desktop-16x9.mp4 [mobile-9x16.mp4]}"
MOBILE="${2:-}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/images/hero"

command -v ffmpeg >/dev/null || { echo "ffmpeg is required"; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe is required"; exit 1; }

extract() { # $1 src video, $2 out dir, $3 scale filter, $4 max frames
    local src="$1" dir="$2" scale="$3" max="$4"
    local dur fps
    dur=$(ffprobe -v error -select_streams v:0 -show_entries format=duration -of csv=p=0 "$src")
    fps=$(python3 -c "print(min(24, $max / $dur))")
    rm -rf "$dir"; mkdir -p "$dir"
    ffmpeg -hide_banner -loglevel error -i "$src" \
        -vf "fps=${fps},${scale}:flags=lanczos" \
        -c:v libwebp -quality 68 -preset photo \
        "$dir/f-%04d.webp"
    ls "$dir"/f-*.webp | wc -l | tr -d ' '
}

echo "Desktop: $DESKTOP"
D_COUNT=$(extract "$DESKTOP" "$OUT/frames" "scale=1280:-2" 168)
ffmpeg -hide_banner -loglevel error -y -i "$DESKTOP" \
    -vf "scale=1280:-2:flags=lanczos" -vframes 1 -q:v 3 "$OUT/poster.jpg"
echo "  -> $D_COUNT frames"

M_JSON=""
if [ -n "$MOBILE" ]; then
    echo "Mobile: $MOBILE"
    M_COUNT=$(extract "$MOBILE" "$OUT/frames-mobile" "scale=720:-2" 108)
    echo "  -> $M_COUNT frames"
    M_JSON=$(printf ',\n    "mobile": {\n        "frames": %s,\n        "pattern": "frames-mobile/f-{i}.webp",\n        "pad": 4,\n        "finale_layer": 1\n    }' "$M_COUNT")
fi

cat > "$OUT/manifest.json" <<EOF
{
    "frames": $D_COUNT,
    "pattern": "frames/f-{i}.webp",
    "pad": 4,
    "width": 1280,
    "poster": "poster.jpg",
    "finale_layer": 0${M_JSON}
}
EOF

echo "Done: $(du -sh "$OUT" | cut -f1) total in images/hero/"
echo "Manifest written — the hero scrubs the video(s) on next load."
