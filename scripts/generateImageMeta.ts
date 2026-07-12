import "dotenv/config";
import fs from "fs";
import sharp from "sharp";
import { r2ListImages, r2GetImage } from "../utils/r2";
import { DATA_DIR, IMAGE_META_JSON } from "../config/paths";

interface ImageMeta {
  width: number;
  height: number;
  blurDataURL: string;
}

// Incremental: only downloads images missing from the manifest and drops
// entries for images deleted from the bucket. Rerun after publishing images:
//   pnpm generate:image-meta
async function main() {
  const existing: Record<string, ImageMeta> = fs.existsSync(IMAGE_META_JSON)
    ? JSON.parse(fs.readFileSync(IMAGE_META_JSON, "utf8"))
    : {};

  const filenames = (await r2ListImages()).filter(
    (name) => !name.includes("/") && /\.(jpg|jpeg|png|gif|webp)$/i.test(name)
  );

  const manifest: Record<string, ImageMeta> = {};
  let added = 0;

  for (const name of filenames) {
    if (existing[name]) {
      manifest[name] = existing[name];
      continue;
    }
    try {
      const buffer = await r2GetImage(name);
      const image = sharp(buffer);
      const { width, height } = await image.metadata();
      if (!width || !height) continue;

      const blur = await image
        .resize(12, 12, { fit: "inside" })
        .webp({ quality: 50 })
        .toBuffer();

      manifest[name] = {
        width,
        height,
        blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
      };
      added++;
    } catch (error) {
      console.warn(`⚠️  Skipping ${name}:`, (error as Error).message);
    }
  }

  const removed =
    Object.keys(existing).length - (Object.keys(manifest).length - added);

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))
  );
  fs.writeFileSync(IMAGE_META_JSON, JSON.stringify(sorted, null, 1) + "\n");

  console.log(
    `✓ ${Object.keys(manifest).length} images (${added} added, ${removed} removed)`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
