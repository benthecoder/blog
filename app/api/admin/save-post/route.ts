import fs from "fs";
import { writeMarkdownFile } from "@/utils/content/markdown";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { isSafeSlug } from "@/config/paths";
import { parseKind, contentPaths } from "@/utils/content/kind";
import { toDateString } from "@/utils/content/essayDate";

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  let kind: ReturnType<typeof parseKind> = "post";
  try {
    const {
      slug,
      title,
      tags,
      date,
      content,
      isNew,
      subtitle,
      updated,
      kind: rawKind,
    } = await request.json();
    kind = parseKind(rawKind);
    if (!kind) {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }

    if (!slug || !title) {
      return NextResponse.json(
        { error: "Slug and title required" },
        { status: 400 }
      );
    }

    // Security: prevent path traversal
    if (!isSafeSlug(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const paths = contentPaths(kind);
    const publishedPath = paths.publishedPath(slug);
    const draftPath = paths.draftPath(slug);

    // Check if post already exists (in either location) when creating new
    if (isNew) {
      if (fs.existsSync(publishedPath)) {
        return NextResponse.json(
          {
            error:
              kind === "essay"
                ? "An essay with this slug already exists"
                : "A post already exists for this date",
          },
          { status: 409 }
        );
      }
      if (fs.existsSync(draftPath)) {
        return NextResponse.json(
          {
            error:
              kind === "essay"
                ? "A draft with this slug already exists"
                : "A draft already exists for this date",
          },
          { status: 409 }
        );
      }
    }

    // Determine where to save: if already published, keep it published; otherwise save as draft
    const isPublished = fs.existsSync(publishedPath);
    const filePath = isPublished ? publishedPath : draftPath;

    const frontmatter =
      kind === "essay"
        ? {
            title,
            subtitle: subtitle ?? "",
            date: toDateString(date),
            ...(updated ? { updated: toDateString(updated) } : {}),
            ...(tags ? { tags } : {}),
          }
        : { title, tags, date };

    writeMarkdownFile(filePath, frontmatter, content, {
      exclusive: Boolean(isNew),
    });

    return NextResponse.json({ success: true, slug, isDraft: !isPublished });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      return NextResponse.json(
        {
          error:
            kind === "essay"
              ? "An essay or draft with this slug already exists"
              : "A post or draft already exists for this date",
        },
        { status: 409 }
      );
    }
    console.error("Save error:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
