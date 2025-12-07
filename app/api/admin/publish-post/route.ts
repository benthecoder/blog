import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const postsDir = path.join(process.cwd(), "posts");
    const draftsDir = path.join(process.cwd(), "posts", "drafts");
    const publishedPath = path.join(postsDir, `${slug}.md`);
    const draftPath = path.join(draftsDir, `${slug}.md`);

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
    const imagesDraftsDir = path.join(
      process.cwd(),
      "public",
      "images",
      "drafts"
    );
    const imagesPublicDir = path.join(process.cwd(), "public", "images");

    if (fs.existsSync(imagesDraftsDir)) {
      const draftImages = fs.readdirSync(imagesDraftsDir);
      const postImages = draftImages.filter((file) =>
        file.startsWith(`${slug}-`)
      );

      postImages.forEach((imageFile) => {
        const sourcePath = path.join(imagesDraftsDir, imageFile);
        const destPath = path.join(imagesPublicDir, imageFile);
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
