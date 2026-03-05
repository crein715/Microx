#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$DIR/dist"

rm -rf "$DIST"
mkdir -p "$DIST"

npx esbuild \
  "$DIR/content.ts" \
  --bundle \
  --outfile="$DIST/content.js" \
  --format=iife \
  --target=chrome100 \
  --minify

npx esbuild \
  "$DIR/popup.ts" \
  --bundle \
  --outfile="$DIST/popup.js" \
  --format=iife \
  --target=chrome100 \
  --minify

npx esbuild \
  "$DIR/background.ts" \
  --bundle \
  --outfile="$DIST/background.js" \
  --format=iife \
  --target=chrome100 \
  --minify

cp "$DIR/content.css" "$DIST/content.css"
cp "$DIR/popup.html" "$DIST/popup.html"

echo "Build complete → $DIST"
