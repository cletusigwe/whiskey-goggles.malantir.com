#!/usr/bin/env bash
# crop_phone.sh  <width>  [output-dir]

set -euo pipefail

WIDTH=${1:? "Pass the phone width, e.g. 1080"}
OUTDIR=${2:-cropped}

mkdir -p "$OUTDIR"

for img in w_{1..6}.png; do
  [[ -f $img ]] || { echo "⚠️  $img not found, skipping"; continue; }
  convert "$img" -gravity center -crop "${WIDTH}x+0+0" +repage "$OUTDIR/$img"
done

echo "✅ Cropped images saved to $OUTDIR/"
