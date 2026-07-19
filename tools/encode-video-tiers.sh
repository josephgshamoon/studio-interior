#!/usr/bin/env bash
# ============================================
# STUDIO CHENILLE — 4K masters → device-tier web encodes
#
# Consumes the Topaz-upscaled masters in ~/studiochenille-masters/4k/
# (4448x3336 portfolio, 5120x2880 / 2880x5120 hero) and produces:
#
#   videos/portfolio/<name>-720.mp4    960x720  (720x960 portrait)
#   videos/portfolio/<name>-1440.mp4   1920x1440 (1440x1920 portrait)
#   videos/hero/hero-desktop-1440.mp4  2560x1440, g=6 scroll-scrub
#   videos/hero/hero-desktop-2160.mp4  3840x2160, g=6 scroll-scrub
#   images/hero/poster-1440.jpg / poster-2160.jpg   (from tier footage)
#   images/hero/frames-mobile-v4/      900x1600 webp, retina phones
#   images/hero/poster-mobile-v4.jpg
#
# The three slowed tiles reproduce the shipped pacing from the master:
# girls-room 3x, kitchen 3x (push-in take), living 2x — minterpolate mci,
# same recipe that produced the current -v2/-v3 clips.
#
# Tile clips are plain loops: default GOP. Hero clips are seek-scrubbed
# by hero-journey.js: g=6 keyframe interval so any currentTime lands
# within 3 frames of an IDR.
# ============================================
set -euo pipefail

M=/home/clawdbot/studiochenille-masters/4k
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="$ROOT/videos/portfolio"
HERO="$ROOT/videos/hero"
IMG="$ROOT/images/hero"
mkdir -p "$PORT" "$HERO"

FF="ffmpeg -hide_banner -loglevel error -y"
X264="-c:v libx264 -preset slow -pix_fmt yuv420p -movflags +faststart -an"

tile() { # $1 master, $2 outbase, $3 scale720, $4 scale1440, $5 extra-vf prefix (slowdown) or ""
  local src="$M/$1" base="$2" pre="$5"
  echo "== $base"
  $FF -i "$src" -vf "${pre}scale=$3:flags=lanczos" $X264 -crf 26 "$PORT/$base-720.mp4"
  $FF -i "$src" -vf "${pre}scale=$4:flags=lanczos" $X264 -crf 26 "$PORT/$base-1440.mp4"
}

SLOW3="setpts=3*PTS,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,"
SLOW2="setpts=2*PTS,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,"

# landscape 4:3
tile hotel-reception-4k.mp4        hotel-reception        960:720 1920:1440 ""
tile hotel-vanity-4k.mp4           hotel-vanity           960:720 1920:1440 ""
tile res-bed-panelling-4k.mp4      res-bed-panelling      960:720 1920:1440 ""
tile showhome-bathroom-4k.mp4      showhome-bathroom      960:720 1920:1440 ""
tile showhome-bedroom-4k.mp4       showhome-bedroom       960:720 1920:1440 ""
tile showhome-guest-bathroom-4k.mp4 showhome-guest-bathroom 960:720 1920:1440 ""
tile showhome-guest-bedroom-4k.mp4 showhome-guest-bedroom 960:720 1920:1440 ""
tile living-pan-4k.mp4             showhome-living        960:720 1920:1440 "$SLOW2"
# portrait 3:4
tile res-cinema-room-4k.mp4        res-cinema-room        720:960 1440:1920 ""
tile res-girls-room-4k.mp4         res-girls-room         720:960 1440:1920 "$SLOW3"
tile res-kitchen-ascot-4k.mp4      res-kitchen-ascot      720:960 1440:1920 "$SLOW3"

# hero scrub tiers — dense keyframes for seek-scrubbing
echo "== hero desktop tiers"
$FF -i "$M/hero-desktop-v4-4k.mp4" -vf "scale=2560:1440:flags=lanczos" \
    $X264 -crf 20 -g 6 -keyint_min 6 "$HERO/hero-desktop-1440.mp4"
$FF -i "$M/hero-desktop-v4-4k.mp4" -vf "scale=3840:2160:flags=lanczos" \
    $X264 -crf 21 -g 6 -keyint_min 6 "$HERO/hero-desktop-2160.mp4"

# posters at each tier's own native resolution, from the tier's own footage
$FF -i "$HERO/hero-desktop-1440.mp4" -vframes 1 -q:v 3 "$IMG/poster-1440.jpg"
$FF -i "$HERO/hero-desktop-2160.mp4" -vframes 1 -q:v 4 "$IMG/poster-2160.jpg"

# retina-phone portrait frame set (canvas backing caps at DPR 2: 900x1600
# covers a 390pt phone's 780px-wide backing with headroom)
echo "== mobile v4 frames"
DUR=$(ffprobe -v error -select_streams v:0 -show_entries format=duration -of csv=p=0 "$M/hero-mobile-v3-4k.mp4")
FPS=$(python3 -c "print(min(24, 108 / $DUR))")
rm -rf "$IMG/frames-mobile-v4"; mkdir -p "$IMG/frames-mobile-v4"
$FF -i "$M/hero-mobile-v3-4k.mp4" -vf "fps=${FPS},scale=900:1600:flags=lanczos" \
    -c:v libwebp -quality 68 -preset photo "$IMG/frames-mobile-v4/f-%04d.webp"
$FF -i "$M/hero-mobile-v3-4k.mp4" -vf "scale=900:1600:flags=lanczos" -vframes 1 -q:v 3 "$IMG/poster-mobile-v4.jpg"

echo "== sizes"
du -sh "$PORT" "$HERO" "$IMG/frames-mobile-v4"
ls "$IMG/frames-mobile-v4" | wc -l
