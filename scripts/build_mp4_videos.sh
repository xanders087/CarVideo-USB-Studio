#!/bin/bash
set -e

mkdir -p public/videos
mkdir -p dist/videos

echo "Rendering High-Definition Automotive MP4 Videos with Live Visualizers..."

# 1. Vallenato / Ritmo Caribe
if [ -f "/tmp/audio_tracks/vallenato.wav" ]; then
  echo "Encoding Vallenato MP4..."
  ffmpeg -y -i /tmp/audio_tracks/vallenato.wav \
    -filter_complex "[0:a]showfreqs=s=1280x720:mode=bar:ascale=log:fscale=log:colors=0x06b6d4|0x10b981|0xf59e0b,format=yuv420p[v]" \
    -map "[v]" -map 0:a \
    -c:v libx264 -pix_fmt yuv420p -profile:v main -level 3.1 -preset ultrafast \
    -c:a aac -b:a 192k -ar 44100 \
    -movflags +faststart \
    public/videos/vallenato.mp4
  cp public/videos/vallenato.mp4 public/videos/ritmo_caribe.mp4
fi

# 2. Synthwave
if [ -f "/tmp/audio_tracks/synthwave.wav" ]; then
  echo "Encoding Synthwave MP4..."
  ffmpeg -y -i /tmp/audio_tracks/synthwave.wav \
    -filter_complex "[0:a]showfreqs=s=1280x720:mode=bar:ascale=log:fscale=log:colors=0xec4899|0x8b5cf6|0x06b6d4,format=yuv420p[v]" \
    -map "[v]" -map 0:a \
    -c:v libx264 -pix_fmt yuv420p -profile:v main -level 3.1 -preset ultrafast \
    -c:a aac -b:a 192k -ar 44100 \
    -movflags +faststart \
    public/videos/neon_highway.mp4
fi

# 3. Rock Carretera
if [ -f "/tmp/audio_tracks/rock.wav" ]; then
  echo "Encoding Rock MP4..."
  ffmpeg -y -i /tmp/audio_tracks/rock.wav \
    -filter_complex "[0:a]showfreqs=s=1280x720:mode=bar:ascale=log:fscale=log:colors=0xef4444|0xf97316|0xeab308,format=yuv420p[v]" \
    -map "[v]" -map 0:a \
    -c:v libx264 -pix_fmt yuv420p -profile:v main -level 3.1 -preset ultrafast \
    -c:a aac -b:a 192k -ar 44100 \
    -movflags +faststart \
    public/videos/asfalto_llamas.mp4
fi

# 4. Electronic / Midnight Bass
if [ -f "/tmp/audio_tracks/synthwave.wav" ]; then
  echo "Encoding Electronic MP4..."
  ffmpeg -y -i /tmp/audio_tracks/synthwave.wav \
    -filter_complex "[0:a]showfreqs=s=1280x720:mode=bar:ascale=log:fscale=log:colors=0x3b82f6|0x6366f1|0xa855f7,format=yuv420p[v]" \
    -map "[v]" -map 0:a \
    -c:v libx264 -pix_fmt yuv420p -profile:v main -level 3.1 -preset ultrafast \
    -c:a aac -b:a 192k -ar 44100 \
    -movflags +faststart \
    public/videos/midnight_bass.mp4
fi

# 5. Lo-Fi / Lluvia Autopista
if [ -f "/tmp/audio_tracks/latin.wav" ]; then
  echo "Encoding Lo-Fi MP4..."
  ffmpeg -y -i /tmp/audio_tracks/latin.wav \
    -filter_complex "[0:a]showfreqs=s=1280x720:mode=bar:ascale=log:fscale=log:colors=0x14b8a6|0x0ea5e9|0x6366f1,format=yuv420p[v]" \
    -map "[v]" -map 0:a \
    -c:v libx264 -pix_fmt yuv420p -profile:v main -level 3.1 -preset ultrafast \
    -c:a aac -b:a 192k -ar 44100 \
    -movflags +faststart \
    public/videos/lluvia_autopista.mp4
  cp public/videos/lluvia_autopista.mp4 public/videos/viento_norte.mp4
fi

# 6. Stereo Diagnostic Test Video
if [ -f "/tmp/audio_tracks/test.wav" ]; then
  echo "Encoding Stereo Test MP4..."
  ffmpeg -y -i /tmp/audio_tracks/test.wav \
    -filter_complex "[0:a]showfreqs=s=1280x720:mode=bar:ascale=cbrt:fscale=log:colors=0x10b981|0x06b6d4|0x3b82f6,format=yuv420p[v]" \
    -map "[v]" -map 0:a \
    -c:v libx264 -pix_fmt yuv420p -profile:v main -level 3.1 -preset ultrafast \
    -c:a aac -b:a 192k -ar 44100 \
    -movflags +faststart \
    public/videos/test.mp4
fi

echo "Copying to dist/videos..."
cp -r public/videos/* dist/videos/ 2>/dev/null || true

echo "All automotive MP4 videos successfully compiled!"
ls -lh public/videos/
