import fs from "fs";
import path from "path";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { IMAGES_DRAFTS_DIR, isSafeSlug } from "@/config/paths";

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const customName = formData.get("name") as string | null;

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

    // Save to drafts folder initially
    if (!fs.existsSync(IMAGES_DRAFTS_DIR)) {
      fs.mkdirSync(IMAGES_DRAFTS_DIR, { recursive: true });
    }

    const filePath = path.join(IMAGES_DRAFTS_DIR, fileName);

    // Always compress and convert to JPEG for Vercel free tier optimization
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Auto-rotate based on EXIF orientation
      let processor = image.rotate();

      // Resize to max 1600px width to save bandwidth
      if (metadata.width && metadata.width > 1600) {
        processor = processor.resize(1600, null, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Always convert to JPEG with quality 85 for best size/quality ratio
      await processor
        .jpeg({ quality: 85, progressive: true, mozjpeg: true })
        .toFile(filePath);
    } else {
      // Not an image, save as-is
      fs.writeFileSync(filePath, new Uint8Array(buffer));
    }

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
