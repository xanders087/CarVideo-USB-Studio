#!/bin/bash
set -e
mkdir -p public/videos

# 1. Neon Highway (Synthwave: frequency sweep synth with pulsating color gradient)
ffmpeg -y -f lavfi -i "mptestsrc=rate=30:duration=12" \
  -f lavfi -i "sine=frequency=220:duration=12" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k public/videos/neon_highway.mp4

# 2. Asfalto en Llamas (Rock: dynamic rhythmic tone)
ffmpeg -y -f lavfi -i "testsrc2=size=1280x720:rate=30:duration=12" \
  -f lavfi -i "sine=frequency=330:duration=12" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k public/videos/asfalto_llamas.mp4

# 3. Ritmo del Caribe (Pop Latino)
ffmpeg -y -f lavfi -i "smptebars=size=1280x720:rate=30:duration=12" \
  -f lavfi -i "sine=frequency=440:duration=12" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k public/videos/ritmo_caribe.mp4

# 4. Midnight Bass (Electrónica)
ffmpeg -y -f lavfi -i "rgbtestsrc=size=1280x720:rate=30:duration=12" \
  -f lavfi -i "sine=frequency=110:duration=12" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k public/videos/midnight_bass.mp4

# 5. Lluvia en la Autopista (Lo-Fi Hip Hop)
ffmpeg -y -f lavfi -i "testsrc=size=1280x720:rate=30:duration=12" \
  -f lavfi -i "sine=frequency=261:duration=12" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k public/videos/lluvia_autopista.mp4

# 6. Viento del Norte (Acústico)
ffmpeg -y -f lavfi -i "yuvtestsrc=size=1280x720:rate=30:duration=12" \
  -f lavfi -i "sine=frequency=392:duration=12" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k public/videos/viento_norte.mp4

echo "All 6 video assets generated successfully!"
ls -lh public/videos/
