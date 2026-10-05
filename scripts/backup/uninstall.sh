#!/bin/sh
# Removes the launchd agent.
PLIST="$HOME/Library/LaunchAgents/xyz.bneo.blog-backup.plist"
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null || true
rm -f "$PLIST"
echo "removed $PLIST"
