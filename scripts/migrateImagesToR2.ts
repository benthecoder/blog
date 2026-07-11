// One-time migration: upload every published image under public/images/
// (skipping drafts/) to R2, and generate data/gallery-manifest.json with the
// dimensions the gallery needs. Does NOT delete local files — verify first,
// then remove them from the repo.
import "dotenv/config";
import fs from "fs";
import path from "path";
import sizeOf from "image-size";
import { IMAGES_DIR } from "../config/paths";
import { getR2Client, r2Bucket, r2PutImage, r2ListImages } from "../utils/r2";
import {
  writeGalleryManifest,
  ManifestImage,
} from "../utils/content/galleryManifest";

const IMAGE_RE = /\.(jpg|jpeg|png|gif|webp|svg)$/i;

function walk(dir: string, base = ""): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (entry.name === "drafts") continue;
      out.push(...walk(path.join(dir, entry.name), rel));
    } else if (IMAGE_RE.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

async function migrate() {
  getR2Client(); // fail fast on missing env
  console.log(`Bucket: ${r2Bucket()}`);

  const files = walk(IMAGES_DIR);
  console.log(`Found ${files.length} images to upload`);

  const manifest: ManifestImage[] = [];
  let uploaded = 0;
  let totalBytes = 0;

  for (const rel of files) {
    const abs = path.join(IMAGES_DIR, rel);
    const body = fs.readFileSync(abs);
    await r2PutImage(rel, body);
    uploaded++;
    totalBytes += body.length;

    // Manifest covers only root-level images (what the gallery shows)
    if (!rel.includes("/")) {
      try {
        const dim = sizeOf(new Uint8Array(body));
        manifest.push({
          filename: rel,
          width: dim.width || 1,
          height: dim.height || 1,
        });
      } catch {
        manifest.push({ filename: rel, width: 1, height: 1 });
      }
    }

    if (uploaded % 25 === 0) console.log(`  ${uploaded}/${files.length}...`);
  }

  console.log(
    `Uploaded ${uploaded} files (${(totalBytes / 1024 / 1024).toFixed(1)}MB)`
  );

  writeGalleryManifest(manifest);
  console.log(`Manifest written: ${manifest.length} gallery entries`);

  // Verify: every local file must exist in the bucket
  const remote = new Set(await r2ListImages());
  const missing = files.filter((f) => !remote.has(f));
  if (missing.length > 0) {
    console.error(
      `✗ MISSING in bucket (${missing.length}):`,
      missing.slice(0, 10)
    );
    process.exit(1);
  }
  console.log(
    `✓ Verified: all ${files.length} files present in bucket (${remote.size} objects total)`
  );
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
