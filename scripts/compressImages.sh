#!/bin/bash

# Script to compress large images in public/images/
# Uses sips (macOS built-in tool)

IMAGES_DIR="public/images"
MAX_WIDTH=1200
QUALITY=65
MIN_SIZE_MB=0

cd "$(dirname "$0")/.." || exit 1

echo "Starting image compression in $IMAGES_DIR"
echo "-------------------------------------------"

compressed_count=0
total_saved=0

for img in "$IMAGES_DIR"/*.{jpg,jpeg,png,JPG,JPEG,PNG}; do
  # Skip if no files match
  [ -e "$img" ] || continue

  # Get file size in MB
  size=$(du -m "$img" | cut -f1)

  # Only process images larger than MIN_SIZE_MB
  if [ "$size" -lt "$MIN_SIZE_MB" ]; then
    echo "Skipping $(basename "$img") (${size}MB - already small)"
    continue
  fi

  echo "Processing $(basename "$img") (${size}MB)..."

  # Create backup if it doesn't exist
  if [ ! -f "$img.backup" ]; then
    cp "$img" "$img.backup"
  fi

  # Get current dimensions
  width=$(sips -g pixelWidth "$img" | tail -1 | awk '{print $2}')

  # Resize if too large
  if [ "$width" -gt "$MAX_WIDTH" ]; then
    echo "  Resizing from ${width}px to ${MAX_WIDTH}px width..."
    sips --resampleWidth "$MAX_WIDTH" "$img" >/dev/null 2>&1
  fi

  # Compress
  echo "  Compressing with quality ${QUALITY}%..."
  sips --setProperty formatOptions "$QUALITY" "$img" >/dev/null 2>&1

  # Check new size
  new_size=$(du -m "$img" | cut -f1)
  saved=$((size - new_size))

  if [ "$saved" -gt 0 ]; then
    echo "  ✓ Compressed to ${new_size}MB (saved ${saved}MB)"
    compressed_count=$((compressed_count + 1))
    total_saved=$((total_saved + saved))
  else
    echo "  ✗ No size reduction, restoring original..."
    mv "$img.backup" "$img"
  fi

  echo ""
done

echo "-------------------------------------------"
echo "Compression complete!"
echo "Compressed: $compressed_count images"
echo "Total saved: ${total_saved}MB"
