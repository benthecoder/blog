#!/bin/sh
# Compiles the PhotoKit helper. The embedded Info.plist carries
# NSPhotoLibraryUsageDescription; without it macOS denies Photos access.
set -e
cd "$(dirname "$0")"
mkdir -p ../../.cache/bin
swiftc -O photokit.swift -o ../../.cache/bin/photokit \
  -Xlinker -sectcreate -Xlinker __TEXT -Xlinker __info_plist -Xlinker Info.plist
echo "Built .cache/bin/photokit"
