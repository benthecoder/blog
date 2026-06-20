import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import {
  IMAGES_DIR,
  IMAGES_DRAFTS_DIR,
  getPostPath,
  getDraftPath,
  isSafeSlug,
} from "@/config/paths";

export async function DELETE(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "No slug provided" }, { status: 400 });
    }

    // Security: prevent path traversal
    if (!isSafeSlug(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    // Check both drafts and published folders
    const draftPath = getDraftPath(slug);
    const publishedPath = getPostPath(slug);

    let deleted = false;
    let deletedFrom = "";

    if (fs.existsSync(draftPath)) {
      fs.unlinkSync(draftPath);
      deleted = true;
      deletedFrom = "drafts";
    } else if (fs.existsSync(publishedPath)) {
      fs.unlinkSync(publishedPath);
      deleted = true;
      deletedFrom = "published";
    }

    if (!deleted) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Also delete associated images if they exist
    const imagesDir = deletedFrom === "drafts" ? IMAGES_DRAFTS_DIR : IMAGES_DIR;

    let imagesDeleted = 0;
    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir);
      const postImages = files.filter((file) => file.startsWith(`${slug}-`));

      postImages.forEach((file) => {
        const filePath = path.join(imagesDir, file);
        fs.unlinkSync(filePath);
      });
      imagesDeleted = postImages.length;
    }

    return NextResponse.json({
      success: true,
      deletedFrom,
      imagesDeleted,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
