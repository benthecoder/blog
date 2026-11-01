import fs from "fs";
import { z } from "zod";
import { readMarkdownFile, writeMarkdownFile } from "@/utils/content/markdown";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { isSafeSlug } from "@/config/paths";
import { parseKind, contentPaths } from "@/utils/content/kind";
import {
  essayFrontmatterSchema,
  postFormatSchema,
  postFrontmatterSchema,
} from "@/utils/content/schemas";
import { describeIssues, FrontmatterError } from "@/utils/content/frontmatter";

// What usePostDraft sends. Title and slug presence get their own message.
const saveBodySchema = z.object({
  slug: z.string(),
  title: z.string(),
  tags: z.string().optional(),
  format: postFormatSchema.optional(),
  date: z.string(),
  content: z.string(),
  isNew: z.boolean().optional(),
  subtitle: z.string().optional(),
  updated: z.string().optional(),
  kind: z.unknown().optional(),
});

export async function POST(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  let kind: ReturnType<typeof parseKind> = "post";
  try {
    const body = saveBodySchema.safeParse(await request.json());
    if (!body.success) {
      const field = body.error.issues[0]?.path[0];
      return NextResponse.json(
        {
          error:
            field === "format"
              ? "Invalid format"
              : `Invalid request: ${describeIssues(body.error)}`,
        },
        { status: 400 }
      );
    }
    const {
      slug,
      title,
      tags,
      format,
      date,
      content,
      isNew,
      subtitle,
      updated,
      kind: rawKind,
    } = body.data;
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

    // Save back to the same version opened by get-post, preferring a pending draft.
    const isPublished =
      !fs.existsSync(draftPath) && fs.existsSync(publishedPath);
    const filePath = isPublished ? publishedPath : draftPath;

    // Check the merged frontmatter with the same schema the site build uses,
    // so the editor can never save a file that would fail to render.
    const schema =
      kind === "essay" ? essayFrontmatterSchema : postFrontmatterSchema;
    const existing = fs.existsSync(filePath)
      ? readMarkdownFile(filePath, schema).data
      : {};
    const frontmatter =
      kind === "essay"
        ? {
            title,
            subtitle: subtitle ?? "",
            date,
            ...(updated ? { updated } : {}),
            ...(tags ? { tags } : {}),
          }
        : { title, tags, date };
    const merged = schema.safeParse({
      ...existing,
      ...frontmatter,
      ...(format !== undefined ? { format } : {}),
    });
    if (!merged.success) {
      return NextResponse.json(
        { error: describeIssues(merged.error) },
        { status: 400 }
      );
    }

    writeMarkdownFile(filePath, merged.data, content, {
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
    if (error instanceof FrontmatterError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("Save error:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
