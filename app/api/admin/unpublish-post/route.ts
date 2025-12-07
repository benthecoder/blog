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

    // Check if published post exists
    if (!fs.existsSync(publishedPath)) {
      return NextResponse.json(
        { error: "Published post not found" },
        { status: 404 }
      );
    }

    // Ensure drafts directory exists
    if (!fs.existsSync(draftsDir)) {
      fs.mkdirSync(draftsDir, { recursive: true });
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

    // Move associated images back to drafts
    const imagesDraftsDir = path.join(
      process.cwd(),
      "public",
      "images",
      "drafts"
    );
    const imagesPublicDir = path.join(process.cwd(), "public", "images");

    // Ensure drafts images directory exists
    if (!fs.existsSync(imagesDraftsDir)) {
      fs.mkdirSync(imagesDraftsDir, { recursive: true });
    }

    if (fs.existsSync(imagesPublicDir)) {
      const publishedImages = fs.readdirSync(imagesPublicDir);
      const postImages = publishedImages.filter((file) =>
        file.startsWith(`${slug}-`)
      );

      postImages.forEach((imageFile) => {
        const sourcePath = path.join(imagesPublicDir, imageFile);
        const destPath = path.join(imagesDraftsDir, imageFile);
        fs.renameSync(sourcePath, destPath);
      });
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
