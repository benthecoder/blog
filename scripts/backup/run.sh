#!/bin/sh
# Launchd entry point (also `pnpm backup`). Skips if the drive is missing or
# the last good backup is under 6 hours old, unless --force.
export PATH="/opt/homebrew/bin:$HOME/Library/pnpm:/usr/bin:/bin:/sbin"

MOUNT="${BACKUP_MOUNT:-/Volumes/chonky}"
DEST="$MOUNT/bneo-blog-backup"
LOG="$HOME/Library/Logs/bneo-blog-backup.log"
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
MAIN=$(git -C "$SCRIPT_DIR" worktree list --porcelain 2>/dev/null | sed -n 's/^worktree //p' | head -1)
[ -d "$MAIN" ] || MAIN="$HOME/blog"

if ! mount | grep -q " on $MOUNT ("; then
  echo "chonky not mounted, skipping"
  exit 0
fi

if ! ls "$DEST" > /dev/null 2>&1 && ! mkdir -p "$DEST" 2> /dev/null; then
  # Mounted but unreadable: macOS hasn't granted removable-volume access.
  echo "cannot access $DEST (removable-volume permission?)" | tee -a "$LOG"
  osascript -e 'display notification "Blog backup FAILED: no access to chonky, see log" with title "Blog backup"'
  exit 1
fi

if [ "$1" != "--force" ] && [ -f "$DEST/backup-log.jsonl" ]; then
  last=$(grep '"ok":true' "$DEST/backup-log.jsonl" | tail -1 | sed -n 's/.*"endMs":\([0-9]*\).*/\1/p')
  now=$(date +%s)
  if [ -n "$last" ] && [ $((now - last / 1000)) -lt 21600 ]; then
    echo "last backup under 6 hours ago, skipping (use --force)"
    exit 0
  fi
fi

out=$(mktemp)
cd "$MAIN" || exit 1
echo "--- $(date) ---" >> "$LOG"
"$MAIN/node_modules/.bin/tsx" --env-file=.env "$SCRIPT_DIR/backup.ts" --dest "$DEST" > "$out" 2>&1
status=$?
cat "$out" >> "$LOG"
cat "$out"

if [ $status -eq 0 ]; then
  summary=$(sed -n 's/^RESULT images=\([0-9]*\) drafts=\([0-9]*\)$/\1 images, \2 drafts/p' "$out")
  osascript -e "display notification \"Blog backed up to chonky: $summary\" with title \"Blog backup\""
else
  osascript -e 'display notification "Blog backup FAILED, see log" with title "Blog backup"'
fi
rm -f "$out"
exit $status
