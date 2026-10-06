import fs from "fs";
import { createHash } from "crypto";
import { getWikiPath, isSafeSlug } from "@/config/paths";
import { readMarkdownFile, writeMarkdownFile } from "./markdown";
import { parseTags } from "./tags";
import type { WikiEditorPage } from "@/types/wiki";

export class WikiEditError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

function isWikiEditorSlug(value: unknown): value is string {
  return (
    isSafeSlug(value) &&
    value !== "new" &&
    value.length <= 120 &&
    /^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(value)
  );
}

function wikiPath(slug: unknown) {
  if (!isWikiEditorSlug(slug))
    throw new WikiEditError(
      "Use letters, numbers, hyphens or underscores for the page address; ‘new’ is reserved.",
      400
    );
  return getWikiPath(slug);
}

function readPage(slug: string) {
  const filePath = wikiPath(slug);
  if (!fs.existsSync(filePath))
    throw new WikiEditError("Wiki page not found", 404);
  if (!fs.lstatSync(filePath).isFile())
    throw new WikiEditError("Wiki page must be a regular file", 400);
  return readMarkdownFile(filePath);
}

function versionOf(data: Record<string, unknown>, content: string) {
  return createHash("sha256")
    .update(JSON.stringify({ data, content }))
    .digest("hex");
}

export function getWikiEditorPage(slug: string): WikiEditorPage {
  const { data, content } = readPage(slug);
  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    category:
      typeof data.category === "string" ? data.category : "uncategorized",
    description: typeof data.description === "string" ? data.description : "",
    tags: parseTags(data.tags).filter(
      (tag) => typeof tag === "string" && tag.trim() !== ""
    ),
    lastUpdated:
      data.lastUpdated instanceof Date
        ? data.lastUpdated.toISOString()
        : String(data.lastUpdated ?? ""),
    content,
    version: versionOf(data, content),
  };
}

/** Synchronous read/compare/write keeps saves serialized in the local authoring server. */
export function saveWikiEditorPage(input: unknown): WikiEditorPage {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new WikiEditError("Invalid page", 400);
  const { slug, title, category, description, tags, content, create, version } =
    input as Record<string, unknown>;
  const filePath = wikiPath(slug);
  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.length > 200 ||
    typeof category !== "string" ||
    category.length > 200 ||
    typeof description !== "string" ||
    description.length > 1000 ||
    typeof tags !== "string" ||
    tags.length > 1000 ||
    typeof content !== "string" ||
    content.length > 2_000_000 ||
    typeof create !== "boolean"
  ) {
    throw new WikiEditError("Invalid page fields", 400);
  }
  let existingData: Record<string, unknown> = {};
  if (create) {
    if (fs.existsSync(filePath))
      throw new WikiEditError("A wiki page already uses this address", 409);
  } else {
    if (typeof version !== "string")
      throw new WikiEditError("Page version required", 400);
    const existing = readPage(slug as string);
    if (versionOf(existing.data, existing.content) !== version)
      throw new WikiEditError(
        "This page changed since you opened it. Reload before saving so those changes are preserved.",
        409
      );
    existingData = existing.data;
  }
  try {
    writeMarkdownFile(
      filePath,
      {
        ...existingData,
        title: title.trim(),
        category: category.trim() || "uncategorized",
        description: description.trim(),
        tags: [...new Set(parseTags(tags).filter(Boolean))],
        lastUpdated: new Date().toISOString(),
      },
      content,
      { exclusive: create }
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST")
      throw new WikiEditError("A wiki page already uses this address", 409);
    throw error;
  }
  return getWikiEditorPage(slug as string);
}
