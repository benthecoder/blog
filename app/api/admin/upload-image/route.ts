import fs from "fs";
import path from "path";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { IMAGES_DRAFTS_DIR, isSafeSlug } from "@/config/paths";
import { r2PutImage } from "@/utils/r2";

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const customName = formData.get("name") as string | null;
    const published = formData.get("published") === "true";

    // Crop region in the source image's own pixels, sent by the crop modal.
    const cropRaw = formData.get("crop");
    let crop: { x: number; y: number; width: number; height: number } | null =
      null;
    if (typeof cropRaw === "string") {
      try {
        const parsed = JSON.parse(cropRaw);
        const nums = [parsed?.x, parsed?.y, parsed?.width, parsed?.height];
        if (nums.every((n) => typeof n === "number" && Number.isFinite(n))) {
          crop = parsed;
        }
      } catch {
        // Malformed crop is ignored rather than failing the upload — the
        // image still lands, just uncropped.
      }
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Security: prevent path traversal via custom name
    if (customName && !isSafeSlug(customName)) {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();

    // Always use .jpg for images to avoid Vercel Image Optimization limits
    const fileName = customName ? `${customName}.jpg` : `${Date.now()}.jpg`;

    // Always compress and convert to JPEG for Vercel free tier optimization
    let output: Buffer;
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Auto-rotate based on EXIF orientation
      let processor = image.rotate();

      // Orientations 5-8 are quarter turns, so .rotate() swaps the axes. The
      // crop arrived in the browser's coordinates, and browsers display the
      // already-oriented image — so compare against the post-rotation size.
      const turned = (metadata.orientation ?? 1) >= 5;
      const srcW = (turned ? metadata.height : metadata.width) ?? 0;
      const srcH = (turned ? metadata.width : metadata.height) ?? 0;

      // Cut the requested region straight out of the original: cropping in
      // the browser first would have meant a second lossy JPEG pass.
      if (crop && srcW && srcH) {
        const left = Math.max(0, Math.min(Math.round(crop.x), srcW - 1));
        const top = Math.max(0, Math.min(Math.round(crop.y), srcH - 1));
        const width = Math.max(
          1,
          Math.min(Math.round(crop.width), srcW - left)
        );
        const height = Math.max(
          1,
          Math.min(Math.round(crop.height), srcH - top)
        );
        processor = processor.extract({ left, top, width, height });
      }

      // Resize to max 1600px width to save bandwidth. Measured on the cropped
      // region, not the original, or a crop out of a large photo would be
      // shrunk on the strength of pixels that were thrown away.
      const widthAfterCrop = crop ? Math.round(crop.width) : srcW;
      if (widthAfterCrop > 1600) {
        processor = processor.resize(1600, null, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      output = await processor
        .jpeg({ quality: 90, progressive: true, mozjpeg: true })
        .toBuffer();
    } else {
      output = buffer;
    }

    // Drafts stage locally and get promoted to R2 by publish-post. A post
    // that is already published never runs that step again, so its images
    // have to go straight to R2 — otherwise they'd sit in drafts forever,
    // resolving locally but 404ing in production.
    if (published) {
      await r2PutImage(fileName, output);
      return NextResponse.json({
        success: true,
        fileName,
        url: `/images/${fileName}`,
      });
    }

    if (!fs.existsSync(IMAGES_DRAFTS_DIR)) {
      fs.mkdirSync(IMAGES_DRAFTS_DIR, { recursive: true });
    }
    fs.writeFileSync(
      path.join(IMAGES_DRAFTS_DIR, fileName),
      new Uint8Array(output)
    );

    return NextResponse.json({
      success: true,
      fileName,
      url: `/images/drafts/${fileName}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
