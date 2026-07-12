import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import {
  DRAFTS_DIR,
  IMAGES_DRAFTS_DIR,
  getPostPath,
  getDraftPath,
  isSafeSlug,
} from "@/config/paths";
import { r2ListImages, r2GetImage, r2DeleteImage } from "@/utils/r2";

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

    // Check if published post exists
    if (!fs.existsSync(publishedPath)) {
      return NextResponse.json(
        { error: "Published post not found" },
        { status: 404 }
      );
    }

    // Ensure drafts directory exists
    if (!fs.existsSync(DRAFTS_DIR)) {
      fs.mkdirSync(DRAFTS_DIR, { recursive: true });
    }

    // Read the published content to update image paths
    let postContent = fs.readFileSync(publishedPath, "utf8");

    // Update image paths from /images/ to /images/drafts/
    postContent = postContent.replace(
      /\/images\/([^/\s)"']+)/g,
      (match, filename) => {
        // Only replace if it's a slug-prefixed image
        if (filename.startsWith(`${slug}-`)) {
          return `/images/drafts/${filename}`;
        }
        return match;
      }
    );

    // Write the updated content
    fs.writeFileSync(draftPath, postContent, "utf8");

    // Delete the published file
    fs.unlinkSync(publishedPath);

    // Move associated images back to local drafts: R2 -> filesystem
    if (!fs.existsSync(IMAGES_DRAFTS_DIR)) {
      fs.mkdirSync(IMAGES_DRAFTS_DIR, { recursive: true });
    }

    const postImages = await r2ListImages(`${slug}-`);
    for (const imageFile of postImages) {
      const body = await r2GetImage(imageFile);
      fs.writeFileSync(path.join(IMAGES_DRAFTS_DIR, imageFile), body);
      await r2DeleteImage(imageFile);
    }

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error("Unpublish error:", error);
    return NextResponse.json(
      { error: "Failed to unpublish post" },
      { status: 500 }
    );
  }
}
