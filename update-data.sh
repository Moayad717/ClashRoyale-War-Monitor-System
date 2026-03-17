#!/bin/bash

set -e

DOWNLOADS_DIR="$HOME/Downloads"
DATA_DIR="$(dirname "$0")/backend/data"
BACKEND_DIR="$(dirname "$0")/backend"

# Find the latest clan CSV in Downloads
LATEST_CSV=$(ls -t "$DOWNLOADS_DIR"/clan-2Q9Q2CU-*.csv 2>/dev/null | head -1)

if [ -z "$LATEST_CSV" ]; then
  echo "❌ No clan CSV file found in $DOWNLOADS_DIR"
  exit 1
fi

echo "📄 Found: $LATEST_CSV"

# Copy and rename to the expected filename
cp "$LATEST_CSV" "$DATA_DIR/clan-2Q9Q2CU.csv"
echo "✅ Replaced backend data file"

# Deploy to Fly.io
echo "🚀 Deploying backend..."
cd "$BACKEND_DIR"
fly deploy

echo "✅ Done! New data is live."
