#!/bin/bash
set -e
cd "$(dirname "$0")"
pnpm install
pnpm build
echo "Build complete! Load extension from ./dist directory"
