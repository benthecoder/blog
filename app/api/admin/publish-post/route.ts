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

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    // Security: prevent path traversal
    if (!isSafeSlug(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const publishedPath = getPostPath(slug);
    const draftPath = getDraftPath(slug);

    // Check if already published
    if (fs.existsSync(publishedPath)) {
      return NextResponse.json(
        { error: "Post is already published" },
        { status: 400 }
      );
    }

    // Check if draft exists
    if (!fs.existsSync(draftPath)) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Read the draft content to update image paths
    let postContent = fs.readFileSync(draftPath, "utf8");

    // Update image paths from /images/drafts/ to /images/
    postContent = postContent.replace(/\/images\/drafts\//g, "/images/");

    // Write the updated content
    fs.writeFileSync(publishedPath, postContent, "utf8");

    // Delete the draft file
    fs.unlinkSync(draftPath);

    // Move associated images from drafts to published
    if (fs.existsSync(IMAGES_DRAFTS_DIR)) {
      const draftImages = fs.readdirSync(IMAGES_DRAFTS_DIR);
      const postImages = draftImages.filter((file) =>
        file.startsWith(`${slug}-`)
      );

      postImages.forEach((imageFile) => {
        const sourcePath = path.join(IMAGES_DRAFTS_DIR, imageFile);
        const destPath = path.join(IMAGES_DIR, imageFile);
        fs.renameSync(sourcePath, destPath);
      });
    }

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish post" },
      { status: 500 }
    );
  }
}
