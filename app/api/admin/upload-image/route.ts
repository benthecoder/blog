import fs from "fs";
import path from "path";
import sharp, { type Sharp, type Metadata } from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkAdminAuth } from "@/utils/adminAuth";
import { IMAGES_DRAFTS_DIR, isSafeSlug } from "@/config/paths";
import { r2PutImage } from "@/utils/r2";

const cropSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
});

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const customName = formData.get("name");
    const published = formData.get("published") === "true";
    const rotationRaw = formData.get("rotation");
    if (
      rotationRaw !== null &&
      (typeof rotationRaw !== "string" ||
        !["0", "90", "180", "270"].includes(rotationRaw))
    ) {
      return NextResponse.json({ error: "Invalid rotation" }, { status: 400 });
    }
    const rotation = Number(rotationRaw ?? 0);

    // Crop region in the source image's own pixels, sent by the crop modal.
    const cropRaw = formData.get("crop");
    let crop: z.infer<typeof cropSchema> | null = null;
    if (cropRaw !== null) {
      if (typeof cropRaw !== "string") {
        return NextResponse.json({ error: "Invalid crop" }, { status: 400 });
      }
      try {
        const parsed: unknown = JSON.parse(cropRaw);
        const result = cropSchema.safeParse(parsed);
        if (!result.success) {
          return NextResponse.json({ error: "Invalid crop" }, { status: 400 });
        }
        crop = result.data;
      } catch {
        return NextResponse.json({ error: "Invalid crop" }, { status: 400 });
      }
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Security: prevent path traversal via custom name
    if (
      customName !== null &&
      (typeof customName !== "string" ||
        (customName !== "" && !isSafeSlug(customName)))
    ) {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Uploaded photos use one consistent JPEG encoding.
    const fileName = customName ? `${customName}.jpg` : `${Date.now()}.jpg`;

    // Inspect the bytes, not the filename: every stored .jpg must be a JPEG.
    let image: Sharp;
    let metadata: Metadata;
    try {
      image = sharp(buffer);
      metadata = await image.metadata();
    } catch {
      return NextResponse.json(
        { error: "Invalid or unsupported image" },
        { status: 400 }
      );
    }

    // Apply EXIF orientation first, then the manual rotation shown in the preview.
    let processor = image.autoOrient().rotate(rotation);

    // EXIF orientations 5-8 and manual quarter turns each swap the axes. The
    // crop arrived in the browser's coordinates, and browsers display the
    // already-oriented image — so compare against the post-rotation size.
    const turned = (metadata.orientation ?? 1) >= 5;
    const swapped = turned !== (rotation === 90 || rotation === 270);
    const srcW = (swapped ? metadata.height : metadata.width) ?? 0;
    const srcH = (swapped ? metadata.width : metadata.height) ?? 0;

    // Cut the requested region straight out of the original: cropping in
    // the browser first would have meant a second lossy JPEG pass.
    if (crop && srcW && srcH) {
      const left = Math.max(0, Math.min(Math.round(crop.x), srcW - 1));
      const top = Math.max(0, Math.min(Math.round(crop.y), srcH - 1));
      const width = Math.max(1, Math.min(Math.round(crop.width), srcW - left));
      const height = Math.max(1, Math.min(Math.round(crop.height), srcH - top));
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

    const output = await processor
      .jpeg({ quality: 90, progressive: true, mozjpeg: true })
      .toBuffer();

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
