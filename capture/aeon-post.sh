#!/usr/bin/env bash
# Turns the raw recordings into small web MP4s and downloads the site's own videos.
set -uo pipefail
cd out
mkdir -p rec site-videos
for n in nav cards quiz steps; do
  ss=$(node -e "console.log(require('./marks.json')['$n']||0)")
  ffmpeg -nostdin -y -loglevel error -ss "$ss" -i raw/$n.webm -vf "scale=1440:-2,fps=30" -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart -an rec/$n.mp4 || echo "convert failed $n"
done
while read -r url; do
  [ -z "$url" ] && continue
  f=$(basename "${url%%\?*}")
  curl -sSL --max-time 120 "$url" -o "site-videos/orig-$f" && \
  ffmpeg -nostdin -y -loglevel error -i "site-videos/orig-$f" -vf "scale='min(1280,iw)':-2" -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart -an "site-videos/$f" || echo "video failed $f"
  rm -f "site-videos/orig-$f"
done < videos.txt
rm -rf raw
ls -la . rec site-videos
