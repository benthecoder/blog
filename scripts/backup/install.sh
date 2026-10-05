#!/bin/sh
# Installs the launchd agent that backs up the blog when the drive mounts.
set -e
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PLIST="$HOME/Library/LaunchAgents/xyz.bneo.blog-backup.plist"
mkdir -p "$HOME/Library/LaunchAgents"
sed -e "s|__RUN_SH__|$SCRIPT_DIR/run.sh|" -e "s|__HOME__|$HOME|g" \
  "$SCRIPT_DIR/launchd.plist.template" > "$PLIST"
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "installed $PLIST"
