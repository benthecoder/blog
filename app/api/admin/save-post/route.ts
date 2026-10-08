import fs from "fs";
import { z } from "zod";
import { writeMarkdownFile } from "@/utils/content/markdown";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { getPostPath, getDraftPath, isSafeSlug } from "@/config/paths";

const postSaveSchema = z.object({
  slug: z.string().min(1).refine(isSafeSlug),
  title: z.string().min(1),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  date: z.string().optional(),
  content: z.string(),
  isNew: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSaveSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.path[0] === "slug"
            ? "Invalid slug"
            : "Invalid post fields",
      },
      { status: 400 }
    );
  }
  const { slug, title, tags, date, content, isNew } = parsed.data;

  try {
    const publishedPath = getPostPath(slug);
    const draftPath = getDraftPath(slug);

    // Check if post already exists (in either location) when creating new
    if (isNew) {
      if (fs.existsSync(publishedPath)) {
        return NextResponse.json(
          { error: "A post already exists for this date" },
          { status: 409 }
        );
      }
      if (fs.existsSync(draftPath)) {
        return NextResponse.json(
          { error: "A draft already exists for this date" },
          { status: 409 }
        );
      }
    }

    // Determine where to save: if already published, keep it published; otherwise save as draft
    const isPublished = fs.existsSync(publishedPath);
    const filePath = isPublished ? publishedPath : draftPath;

    writeMarkdownFile(filePath, { title, tags, date }, content, {
      exclusive: Boolean(isNew),
    });

    return NextResponse.json({ success: true, slug, isDraft: !isPublished });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      return NextResponse.json(
        { error: "A post or draft already exists for this date" },
        { status: 409 }
      );
    }
    console.error("Save error:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
