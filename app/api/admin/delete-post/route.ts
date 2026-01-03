import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "No slug provided" }, { status: 400 });
    }

    // Security: prevent path traversal
    if (slug.includes("..") || slug.includes("/")) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    // Check both drafts and published folders
    const draftPath = path.join(process.cwd(), "posts", "drafts", `${slug}.md`);
    const publishedPath = path.join(process.cwd(), "posts", `${slug}.md`);

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
    const imagesDir = path.join(
      process.cwd(),
      "public",
      "images",
      deletedFrom === "drafts" ? "drafts" : ""
    );

    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir);
      const postImages = files.filter((file) => file.startsWith(`${slug}-`));

      postImages.forEach((file) => {
        const filePath = path.join(imagesDir, file);
        fs.unlinkSync(filePath);
      });
    }

    return NextResponse.json({
      success: true,
      deletedFrom,
      imagesDeleted: 0,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
