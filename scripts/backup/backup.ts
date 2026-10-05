/**
 * Backs up everything that has only one copy to an external drive:
 *   - the R2 image bucket (additive mirror, never deletes)
 *   - drafts, posts, wiki and draft images (hard-linked point-in-time snapshots)
 *   - the Neon `tweets` table (/thoughts) as JSON
 *   - the git repo as a bundle
 *
 *   cd <main checkout> && npx tsx --env-file=.env scripts/backup/backup.ts [--dest <dir>]
 *
 * Exits 1 if any verification fails. See README.md on the drive for restore steps.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execFileSync } from "child_process";
import { pipeline } from "stream/promises";
import type { Readable } from "stream";
import { GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { neon } from "@neondatabase/serverless";
import { getR2Client, r2Bucket } from "../../utils/r2";

const DEFAULT_DEST = "/Volumes/chonky/bneo-blog-backup";
const CONCURRENCY = 8;

const destArg = process.argv.indexOf("--dest");
const DEST = path.resolve(
  destArg !== -1 ? process.argv[destArg + 1] : DEFAULT_DEST
);

/** The main checkout holds the gitignored drafts and .env; it is always the first worktree. */
function findMainCheckout(): string {
  try {
    const out = execFileSync(
      "git",
      ["-C", __dirname, "worktree", "list", "--porcelain"],
      { encoding: "utf8" }
    );
    const first = out.split("\n").find((l) => l.startsWith("worktree "));
    if (first) return first.slice("worktree ".length);
  } catch {}
  return "/Users/bneo/blog";
}
const MAIN = findMainCheckout();

/** Never write into a plain folder that merely sits where a volume should be. */
function volumeMounted(dest: string): boolean {
  const m = dest.match(/^\/Volumes\/[^/]+/);
  if (!m) return true;
  try {
    return fs.statSync(m[0]).dev !== fs.statSync("/").dev;
  } catch {
    return false;
  }
}

const stamp = (d: Date) =>
  d.toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15);
const sha256 = (file: string) =>
  crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

type RemoteObject = { key: string; size: number; etag: string };

async function listR2(): Promise<RemoteObject[]> {
  const out: RemoteObject[] = [];
  let token: string | undefined;
  do {
    const res = await getR2Client().send(
      new ListObjectsV2Command({
        Bucket: r2Bucket(),
        ContinuationToken: token,
      })
    );
    for (const o of res.Contents ?? []) {
      if (o.Key && !o.Key.endsWith("/"))
        out.push({ key: o.Key, size: o.Size ?? 0, etag: o.ETag ?? "" });
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out;
}

/** Download missing/changed objects. Old copies go to r2-replaced/<ts>/. */
async function syncR2(ts: string) {
  const root = path.join(DEST, "r2");
  const replacedRoot = path.join(DEST, "r2-replaced", ts);
  const etagFile = path.join(DEST, "r2-etags.json");
  const etags: Record<string, string> = fs.existsSync(etagFile)
    ? JSON.parse(fs.readFileSync(etagFile, "utf8"))
    : {};

  const remote = await listR2();
  const todo = remote.filter((o) => {
    const file = path.join(root, o.key);
    if (!fs.existsSync(file)) return true;
    if (fs.statSync(file).size !== o.size) return true;
    return etags[o.key] !== undefined && etags[o.key] !== o.etag;
  });

  let replaced = 0;
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const o = todo[next++];
      const file = path.join(root, o.key);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      if (fs.existsSync(file)) {
        const old = path.join(replacedRoot, o.key);
        fs.mkdirSync(path.dirname(old), { recursive: true });
        fs.renameSync(file, old);
        replaced++;
      }
      const res = await getR2Client().send(
        new GetObjectCommand({ Bucket: r2Bucket(), Key: o.key })
      );
      const tmp = `${file}.part`;
      await pipeline(res.Body as Readable, fs.createWriteStream(tmp));
      fs.renameSync(tmp, file);
      etags[o.key] = o.etag;
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  for (const o of remote) etags[o.key] ??= o.etag;
  fs.writeFileSync(etagFile, JSON.stringify(etags));

  const missing = remote.filter((o) => {
    const file = path.join(root, o.key);
    return !fs.existsSync(file) || fs.statSync(file).size !== o.size;
  });
  const localCount = walk(root).filter((f) => !f.endsWith(".part")).length;
  return {
    remote: remote.length,
    local: localCount,
    downloaded: todo.length,
    replaced,
    bytes: remote.reduce((n, o) => n + o.size, 0),
    missing: missing.map((o) => o.key),
  };
}

function rsyncDir(src: string, dest: string, prev: string | null) {
  if (!fs.existsSync(src)) {
    // e.g. wiki/ when the main checkout is on a branch that predates it
    console.log(`  (skipping ${src}: not present)`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  const args = ["-a"];
  if (prev && fs.existsSync(prev)) args.push(`--link-dest=${prev}`);
  execFileSync("rsync", [...args, `${src}/`, `${dest}/`]);
}

async function exportThoughts(file: string) {
  const sql = neon(process.env.POSTGRES_URL!);
  const rows = await sql`SELECT * FROM tweets ORDER BY id`;
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM tweets`;
  fs.writeFileSync(file, JSON.stringify(rows, null, 2));
  return { rows: rows.length, expected: Number(count) };
}

const README = `# bneo-blog-backup

Backup of bneo.xyz, written by scripts/backup/backup.ts in the blog repo.
Run \`pnpm backup\` in the main checkout, or plug this drive in (launchd agent).

- r2/images/...            additive mirror of the R2 bucket. Never deletes.
                           Restore: upload the files back with the same keys.
- r2-replaced/<ts>/...     older copies of R2 objects that changed.
- snapshots/<ts>/          full point-in-time copy; unchanged files are hard links.
    posts/ (incl. drafts/), wiki/, public-images-drafts/
                           Restore: copy back into the repo (public-images-drafts -> public/images/drafts).
    thoughts.json          export of the Neon "tweets" table (id, content, created_at).
                           Restore: INSERT the rows back (keep the ids).
    blog.bundle            git bundle of all refs.
                           Restore: git clone blog.bundle blog   (then git branch -a)
    manifest.json          counts, sizes, sha256 for drafts and thoughts.
- latest -> snapshots/<newest>
- backup-log.jsonl         one line per run.

Nothing is pruned automatically. The .env file is NOT backed up.
`;

async function main() {
  const start = new Date();
  if (!volumeMounted(DEST)) {
    console.log("chonky not mounted, skipping");
    return;
  }
  const ts = stamp(start);
  fs.mkdirSync(path.join(DEST, "snapshots"), { recursive: true });
  const latestLink = path.join(DEST, "latest");
  const prev = fs.existsSync(latestLink) ? fs.realpathSync(latestLink) : null;
  const snap = path.join(DEST, "snapshots", ts);
  const failures: string[] = [];
  const check = (ok: boolean, msg: string) => {
    if (!ok) failures.push(msg);
  };

  console.log(`backup -> ${DEST} (source ${MAIN})`);

  // 1. R2
  const r2 = await syncR2(ts);
  check(
    r2.missing.length === 0,
    `R2: ${r2.missing.length} keys missing/mismatched`
  );
  check(r2.local >= r2.remote, `R2: local ${r2.local} < remote ${r2.remote}`);

  // 2. snapshot
  const dirs: [string, string][] = [
    ["posts", "posts"],
    ["wiki", "wiki"],
    ["public/images/drafts", "public-images-drafts"],
  ];
  for (const [src, name] of dirs) {
    rsyncDir(
      path.join(MAIN, src),
      path.join(snap, name),
      prev && path.join(prev, name)
    );
  }
  const srcDrafts = walk(path.join(MAIN, "posts/drafts")).filter((f) =>
    f.endsWith(".md")
  );
  const snapDrafts = walk(path.join(snap, "posts/drafts")).filter((f) =>
    f.endsWith(".md")
  );
  check(
    srcDrafts.length === snapDrafts.length,
    `drafts: source ${srcDrafts.length} != snapshot ${snapDrafts.length}`
  );

  // 3. thoughts
  const thoughtsFile = path.join(snap, "thoughts.json");
  const thoughts = await exportThoughts(thoughtsFile);
  check(
    thoughts.rows === thoughts.expected,
    `thoughts: exported ${thoughts.rows} != count ${thoughts.expected}`
  );

  // 4. git bundle
  const bundle = path.join(snap, "blog.bundle");
  execFileSync("git", ["-C", MAIN, "bundle", "create", bundle, "--all"], {
    stdio: "ignore",
  });
  let bundleOk = true;
  try {
    execFileSync("git", ["-C", MAIN, "bundle", "verify", bundle], {
      stdio: "ignore",
    });
  } catch {
    bundleOk = false;
  }
  check(bundleOk, "git bundle verify failed");

  // 5. manifest, and byte-for-byte check of every draft against the source
  const files: Record<string, { size: number; sha256: string }> = {};
  for (const name of ["posts/drafts", "public-images-drafts"]) {
    for (const f of walk(path.join(snap, name))) {
      files[path.relative(snap, f)] = {
        size: fs.statSync(f).size,
        sha256: sha256(f),
      };
    }
  }
  for (const f of ["thoughts.json", "blog.bundle"]) {
    const p = path.join(snap, f);
    files[f] = { size: fs.statSync(p).size, sha256: sha256(p) };
  }
  for (const f of srcDrafts) {
    const rel = path.join(
      "posts/drafts",
      path.relative(path.join(MAIN, "posts/drafts"), f)
    );
    check(
      files[rel]?.sha256 === sha256(f),
      `draft differs from source: ${rel}`
    );
  }
  const count = (d: string, ext: string) =>
    walk(path.join(snap, d)).filter((f) => f.endsWith(ext)).length;
  const manifest = {
    createdAt: start.toISOString(),
    counts: {
      r2Objects: r2.remote,
      posts: count("posts", ".md") - snapDrafts.length,
      drafts: snapDrafts.length,
      wiki: count("wiki", ".md"),
      thoughts: thoughts.rows,
    },
    files,
  };
  fs.writeFileSync(
    path.join(snap, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  fs.writeFileSync(path.join(DEST, "README.md"), README);

  // 6. summary, log, latest
  const ok = failures.length === 0;
  const secs = Math.round((Date.now() - start.getTime()) / 1000);
  const rows: [string, string][] = [
    ["R2 objects (remote/local)", `${r2.remote}/${r2.local}`],
    ["R2 downloaded / replaced", `${r2.downloaded} / ${r2.replaced}`],
    ["posts", String(manifest.counts.posts)],
    ["drafts (source/snapshot)", `${srcDrafts.length}/${snapDrafts.length}`],
    ["wiki", String(manifest.counts.wiki)],
    ["thoughts (rows/count)", `${thoughts.rows}/${thoughts.expected}`],
    ["git bundle verified", bundleOk ? "yes" : "NO"],
    ["snapshot", ts],
    ["seconds", String(secs)],
  ];
  console.log("\n" + rows.map(([k, v]) => `  ${k.padEnd(28)}${v}`).join("\n"));
  failures.forEach((f) => console.error(`FAIL: ${f}`));

  fs.appendFileSync(
    path.join(DEST, "backup-log.jsonl"),
    JSON.stringify({
      start: start.toISOString(),
      end: new Date().toISOString(),
      endMs: Date.now(),
      ok,
      snapshot: ts,
      images: r2.remote,
      drafts: snapDrafts.length,
      downloaded: r2.downloaded,
      thoughts: thoughts.rows,
      failures,
    }) + "\n"
  );

  if (!ok) {
    console.error("BACKUP FAILED");
    process.exit(1);
  }
  const tmpLink = path.join(DEST, `.latest-${ts}`);
  fs.symlinkSync(path.join("snapshots", ts), tmpLink);
  fs.renameSync(tmpLink, latestLink);
  console.log(`RESULT images=${r2.remote} drafts=${snapDrafts.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
