# Drive backup

`pnpm backup` copies everything on the blog that has only one copy to the
external drive **chonky** (`/Volumes/chonky/bneo-blog-backup`). Run it after
plugging the drive in; it takes a few seconds.

## Why it exists

| What | Otherwise lives | Why it needs a backup |
|---|---|---|
| R2 images (`images/…`) | Cloudflare R2 only | R2 has no versioning or backups. Images uploaded through the admin editor never go into git. |
| Drafts (`posts/drafts/`, `public/images/drafts/`) | this Mac only | gitignored |
| `/thoughts` (Neon `tweets` table) | Neon only | Neon's restore window is only days |
| Posts, wiki, git history | git + GitHub | belt and braces: a bundle of every branch, including local-only ones |

## Running it

```sh
pnpm backup                          # from the main checkout (~/blog)
pnpm --dir ~/blog-backup backup      # or from any worktree that has the script
```

- It always reads from the **main checkout** (the first entry in
  `git worktree list`), because that's where the gitignored drafts and `.env`
  are, even when run from another worktree.
- If chonky isn't mounted, it prints a message and exits 0.
- The first time, macOS asks whether your terminal may access removable
  volumes; allow it.
- When it finishes, a macOS notification says whether it worked. The full
  output goes to `~/Library/Logs/bneo-blog-backup.log`.

It doesn't run automatically. macOS blocks background (launchd) jobs from
reading removable drives unless they run as an approved named app, so we kept
it manual.

## What a run does

1. **R2 mirror** (`r2/`): lists the bucket and downloads only new or
   changed objects, 8 at a time. It never deletes. If an object changes, the
   old copy moves to `r2-replaced/<snapshot>/`.
2. **Snapshot** (`snapshots/<YYYYMMDD_HHMMSS>/`, UTC): `rsync --link-dest`
   against the previous snapshot, so unchanged files are hard links and cost
   no space. Each snapshot is a full, browsable copy of `posts/` (with
   drafts), `wiki/` and `public-images-drafts/`.
3. **Thoughts**: `SELECT * FROM tweets` into `thoughts.json`.
4. **Git**: `git bundle create --all` into `blog.bundle`, then `git bundle verify`.
5. **Verify**, and fail (exit 1, failure notification) unless:
   - every R2 key is present locally with the right size
   - the draft count matches the source and every draft's sha256 matches
   - the thoughts row count equals `count(*)`
   - the bundle verifies

   Then it writes `manifest.json`, appends to `backup-log.jsonl`, and moves
   the `latest` symlink.

Nothing is ever pruned. Each run adds about 10 MB (the bundle and thoughts
export are rewritten every time); the 2 TB drive has room for decades.

## Restoring

| Part | How |
|---|---|
| R2 images | Upload `r2/images/*` back to the bucket under the same keys (`images/<name>`). |
| Drafts | Copy `latest/posts/drafts/` to `posts/drafts/`, and `latest/public-images-drafts/` to `public/images/drafts/`. |
| Posts / wiki | Copy from `latest/posts/` and `latest/wiki/`. Git has them too. |
| Thoughts | Insert the rows from `latest/thoughts.json` back into `tweets`, keeping their ids. |
| Git | `git clone /Volumes/chonky/bneo-blog-backup/latest/blog.bundle blog`, then `git branch -a`. |

To restore from an older point in time, use any `snapshots/<ts>/` folder
instead of `latest/`.

`.env` (credentials) is deliberately **not** backed up; it would sit
unencrypted on the drive. The keys can be recovered from the Cloudflare, Neon
and Vercel dashboards.
