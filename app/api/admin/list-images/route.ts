import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const draftsDir = path.join(process.cwd(), "public", "images", "drafts");
    const imagesDir = path.join(process.cwd(), "public", "images");

    const postImages: string[] = [];

    // Check drafts folder
    if (fs.existsSync(draftsDir)) {
      const draftFiles = fs.readdirSync(draftsDir);
      postImages.push(
        ...draftFiles.filter((file) => file.startsWith(`${slug}-`))
      );
    }

    // Check published images folder
    if (fs.existsSync(imagesDir)) {
      const publishedFiles = fs.readdirSync(imagesDir);
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
