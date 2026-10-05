#!/bin/sh
# `pnpm backup`: run after plugging in chonky. Backs up from the main checkout
# (where the gitignored drafts and .env live), whichever worktree this runs from.
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
