import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { IMAGES_DIR, IMAGES_DRAFTS_DIR, isSafeSlug } from "@/config/paths";

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

    const postImages: string[] = [];

    // Check drafts folder
    if (fs.existsSync(IMAGES_DRAFTS_DIR)) {
      const draftFiles = fs.readdirSync(IMAGES_DRAFTS_DIR);
      postImages.push(
        ...draftFiles.filter((file) => file.startsWith(`${slug}-`))
      );
    }

    // Check published images folder
    if (fs.existsSync(IMAGES_DIR)) {
      const publishedFiles = fs.readdirSync(IMAGES_DIR);
      postImages.push(
        ...publishedFiles.filter((file) => file.startsWith(`${slug}-`))
      );
    }

    return NextResponse.json(postImages);
  } catch (error) {
    console.error("List images error:", error);
    return NextResponse.json(
      { error: "Failed to list images" },
      { status: 500 }
    );
  }
}
