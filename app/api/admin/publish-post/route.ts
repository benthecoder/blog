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
import { r2PutImage } from "@/utils/r2";

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  let release: (() => void) | undefined;
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

    const original = fs.readFileSync(draftPath, "utf8");
    const postContent = original.replace(/\/images\/drafts\//g, "/images/");
    const postImages = fs.existsSync(IMAGES_DRAFTS_DIR)
      ? fs
          .readdirSync(IMAGES_DRAFTS_DIR)
          .filter((file) => file.startsWith(`${slug}-`))
      : [];
    const uploaded = new Map<string, { size: number; mtimeMs: number }>();

    // Keep the draft and every local photo until all uploads succeed.
    for (const imageFile of postImages) {
      const sourcePath = path.join(IMAGES_DRAFTS_DIR, imageFile);
      const { size, mtimeMs } = fs.statSync(sourcePath);
      await r2PutImage(imageFile, fs.readFileSync(sourcePath));
      uploaded.set(imageFile, { size, mtimeMs });
    }
    if (fs.readFileSync(draftPath, "utf8") !== original) {
      return NextResponse.json(
        { error: "Draft changed during publishing; retry" },
        { status: 409 }
      );
    }
    writeAtomicFile(publishedPath, postContent, { exclusive: true });
    fs.unlinkSync(draftPath);

    for (const [imageFile, snapshot] of uploaded) {
      const sourcePath = path.join(IMAGES_DRAFTS_DIR, imageFile);
      try {
        const current = fs.statSync(sourcePath);
        if (
          current.size === snapshot.size &&
          current.mtimeMs === snapshot.mtimeMs
        )
          fs.unlinkSync(sourcePath);
      } catch (error) {
        console.warn(
          "Published photo retained locally or already removed:",
          imageFile,
          error
        );
      }
    }

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      return NextResponse.json(
        { error: "Post is already published" },
        { status: 409 }
      );
    }
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish post" },
      { status: 500 }
    );
  } finally {
    release?.();
  }
}
