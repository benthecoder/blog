import fs from "fs";
import path from "path";
import sizeOf from "image-size";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import {
  IMAGES_DRAFTS_DIR,
  getPostPath,
  getDraftPath,
  isSafeSlug,
} from "@/config/paths";
import { r2PutImage } from "@/utils/r2";
import { addToGalleryManifest } from "@/utils/content/galleryManifest";

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

    // Publish associated images: local drafts -> R2 + gallery manifest
    if (fs.existsSync(IMAGES_DRAFTS_DIR)) {
      const draftImages = fs.readdirSync(IMAGES_DRAFTS_DIR);
      const postImages = draftImages.filter((file) =>
        file.startsWith(`${slug}-`)
      );

      for (const imageFile of postImages) {
        const sourcePath = path.join(IMAGES_DRAFTS_DIR, imageFile);
        const body = fs.readFileSync(sourcePath);
        await r2PutImage(imageFile, body);

        let width = 1;
        let height = 1;
        try {
          const dim = sizeOf(new Uint8Array(body));
          width = dim.width || 1;
          height = dim.height || 1;
        } catch {
          // non-fatal: 1x1 fallback
        }
        addToGalleryManifest({ filename: imageFile, width, height });

        fs.unlinkSync(sourcePath);
      }
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
