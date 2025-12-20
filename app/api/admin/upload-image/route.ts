import fs from "fs";
import path from "path";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const customName = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();

    // Always use .jpg for images to avoid Vercel Image Optimization limits
    const fileName = customName ? `${customName}.jpg` : `${Date.now()}.jpg`;

    // Save to drafts folder initially
    const draftsDir = path.join(process.cwd(), "public", "images", "drafts");

    if (!fs.existsSync(draftsDir)) {
      fs.mkdirSync(draftsDir, { recursive: true });
    }

    const filePath = path.join(draftsDir, fileName);

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
