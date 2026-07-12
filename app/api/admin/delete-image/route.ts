import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { IMAGES_DRAFTS_DIR, isSafeSlug } from "@/config/paths";
import { r2ListImages, r2DeleteImage } from "@/utils/r2";

export async function DELETE(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");

    if (!fileName) {
      return NextResponse.json(
        { error: "No file name provided" },
        { status: 400 }
      );
    }

    // Security: prevent path traversal
    if (!isSafeSlug(fileName)) {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
    }

    // Check local drafts first, then published images in R2
    const draftPath = path.join(IMAGES_DRAFTS_DIR, fileName);

    if (fs.existsSync(draftPath)) {
      fs.unlinkSync(draftPath);
    } else {
      const published = await r2ListImages(fileName);
      if (!published.includes(fileName)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      await r2DeleteImage(fileName);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
