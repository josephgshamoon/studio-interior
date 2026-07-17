#!/usr/bin/env bash
# ============================================
# STUDIO CHENILLE — Hero video → scroll-scrub frames
#
# Turns the Seedance 2.0 hero video into a WebP frame sequence
# that js/hero-journey.js scrubs on scroll. The hero switches from
# zoom mode to video mode automatically once images/hero/manifest.json
# exists.
#
# Usage:
#   bash tools/hero-video-to-frames.sh path/to/hero.mp4 [max_frames]
#
# Defaults to 132 frames (~5.5 MB at 1280x720 q68), loaded
# progressively by the engine — coarse set first, full set after.
# ============================================
set -euo pipefail

VIDEO="${1:?Usage: bash tools/hero-video-to-frames.sh path/to/hero.mp4 [max_frames]}"
MAX_FRAMES="${2:-132}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/images/hero"
FRAMES="$OUT/frames"

command -v ffmpeg >/dev/null || { echo "ffmpeg is required"; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe is required"; exit 1; }

DURATION=$(ffprobe -v error -select_streams v:0 -show_entries format=duration -of csv=p=0 "$VIDEO")
FPS=$(python3 -c "print(min(24, $MAX_FRAMES / $DURATION))")

echo "Source: $VIDEO (${DURATION}s) -> up to $MAX_FRAMES frames @ ${FPS} fps"

rm -rf "$FRAMES"
mkdir -p "$FRAMES"

ffmpeg -hide_banner -loglevel error -i "$VIDEO" \
    -vf "fps=${FPS},scale=1280:-2:flags=lanczos" \
    -c:v libwebp -quality 68 -preset photo \
    "$FRAMES/f-%04d.webp"

COUNT=$(ls "$FRAMES"/f-*.webp | wc -l | tr -d ' ')

# Poster (first frame) for fast LCP / social embeds
ffmpeg -hide_banner -loglevel error -y -i "$VIDEO" \
    -vf "scale=1280:-2:flags=lanczos" -vframes 1 -q:v 3 "$OUT/poster.jpg"

cat > "$OUT/manifest.json" <<EOF
{
    "frames": $COUNT,
    "pattern": "frames/f-{i}.webp",
    "pad": 4,
    "width": 1280,
    "poster": "poster.jpg"
}
EOF

SIZE=$(du -sh "$FRAMES" | cut -f1)
echo "Done: $COUNT frames ($SIZE) in images/hero/frames/"
echo "Manifest: images/hero/manifest.json — the hero will scrub the video on next load."
