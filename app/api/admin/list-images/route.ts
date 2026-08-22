import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { IMAGES_DRAFTS_DIR, isSafeSlug } from "@/config/paths";
import { r2ListImages } from "@/utils/r2";

export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    // Security: prevent path traversal
    if (!isSafeSlug(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    // Each entry carries its own url. The caller can't infer it from the
    // post's draft/published state: a published post can still have images
    // sitting in drafts (uploaded before it was published), and guessing
    // from post state is what left those thumbnails broken.
    const postImages: { name: string; url: string }[] = [];

    // Check drafts folder
    if (fs.existsSync(IMAGES_DRAFTS_DIR)) {
      const draftFiles = fs.readdirSync(IMAGES_DRAFTS_DIR);
      postImages.push(
        ...draftFiles
          .filter((file) => file.startsWith(`${slug}-`))
          .map((name) => ({ name, url: `/images/drafts/${name}` }))
      );
    }

    // Check published images in R2
    const publishedImages = await r2ListImages(`${slug}-`);
    postImages.push(
      ...publishedImages
        .filter((name) => !postImages.some((i) => i.name === name))
        .map((name) => ({ name, url: `/images/${name}` }))
    );

    return NextResponse.json(postImages);
  } catch (error) {
    console.error("List images error:", error);
    return NextResponse.json(
      { error: "Failed to list images" },
      { status: 500 }
    );
  }
}
