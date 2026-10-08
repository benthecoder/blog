import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import {
  IMAGES_DRAFTS_DIR,
  getPostPath,
  getDraftPath,
  isSafeSlug,
} from "@/config/paths";
import { acquirePostTransition } from "@/utils/content/postTransition";
import { writeAtomicFile } from "@/utils/content/atomicFile";
import { r2ListImages, r2GetImage, r2DeleteImage } from "@/utils/r2";

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  let release: (() => void) | undefined;
  let staging: string | undefined;
  const createdImages: string[] = [];
  let draftCreated = false;
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    // Security: prevent path traversal
    if (!isSafeSlug(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const acquired = acquirePostTransition(slug);
    if (!acquired) {
      return NextResponse.json(
        { error: "Post transition already in progress" },
        { status: 409 }
      );
    }
    release = acquired;

    const publishedPath = getPostPath(slug);
    const draftPath = getDraftPath(slug);

    // Check if published post exists
    if (!fs.existsSync(publishedPath)) {
      return NextResponse.json(
        { error: "Published post not found" },
        { status: 404 }
      );
    }

    if (fs.existsSync(draftPath)) {
      return NextResponse.json(
        { error: "A draft already exists" },
        { status: 409 }
      );
    }

    // Read the published content to update image paths
    const original = fs.readFileSync(publishedPath, "utf8");
    let postContent = original;

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

    const postImages = await r2ListImages(`${slug}-`);
    if (
      postImages.some(
        (file) => path.basename(file) !== file || !file.startsWith(`${slug}-`)
      )
    ) {
      throw new Error("Invalid published image name");
    }
    fs.mkdirSync(IMAGES_DRAFTS_DIR, { recursive: true });
    staging = fs.mkdtempSync(path.join(IMAGES_DRAFTS_DIR, ".unpublish-"));

    // Download everything before changing the post or deleting any remote copy.
    for (const imageFile of postImages) {
      const body = await r2GetImage(imageFile);
      fs.writeFileSync(path.join(staging, imageFile), body, { flag: "wx" });
    }
    if (fs.readFileSync(publishedPath, "utf8") !== original) {
      return NextResponse.json(
        { error: "Post changed during unpublishing; retry" },
        { status: 409 }
      );
    }
    for (const imageFile of postImages) {
      const stagedPath = path.join(staging, imageFile);
      const destination = path.join(IMAGES_DRAFTS_DIR, imageFile);
      try {
        fs.linkSync(stagedPath, destination);
        createdImages.push(destination);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        if (!fs.readFileSync(destination).equals(fs.readFileSync(stagedPath))) {
          return NextResponse.json(
            { error: "A different draft photo already exists" },
            { status: 409 }
          );
        }
      }
    }
    writeAtomicFile(draftPath, postContent, { exclusive: true });
    draftCreated = true;
    fs.unlinkSync(publishedPath);

    // At this point every image has a complete local copy referenced by the draft.
    for (const imageFile of postImages) await r2DeleteImage(imageFile);

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      return NextResponse.json(
        { error: "A draft already exists" },
        { status: 409 }
      );
    }
    console.error("Unpublish error:", error);
    return NextResponse.json(
      { error: "Failed to unpublish post" },
      { status: 500 }
    );
  } finally {
    release?.();
    if (!draftCreated) {
      for (const file of createdImages) fs.rmSync(file, { force: true });
    }
    if (staging) fs.rmSync(staging, { recursive: true, force: true });
  }
}
