import fs from "fs";
import { z } from "zod";
import { createHash } from "crypto";
import { getWikiPath, isSafeSlug } from "@/config/paths";
import { readMarkdownFile, writeMarkdownFile } from "./markdown";
import { wikiFrontmatterSchema, type WikiFrontmatter } from "./schemas";
import { parseTags } from "./tags";
import { paperFrontmatter, readPaperFields } from "./paperFields";
import type { WikiEditorPage } from "@/types/wiki";

export class WikiEditError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export function isWikiEditorSlug(value: unknown): value is string {
  return (
    isSafeSlug(value) &&
    value !== "new" &&
    value.length <= 120 &&
    /^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(value)
  );
}

const WIKI_ADDRESS_ERROR =
  "Use letters, numbers, hyphens or underscores for the page address; ‘new’ is reserved.";

function wikiPath(slug: unknown) {
  if (!isWikiEditorSlug(slug)) throw new WikiEditError(WIKI_ADDRESS_ERROR, 400);
  return getWikiPath(slug);
}

function readPage(slug: string) {
  const filePath = wikiPath(slug);
  if (!fs.existsSync(filePath))
    throw new WikiEditError("Wiki page not found", 404);
  if (!fs.lstatSync(filePath).isFile())
    throw new WikiEditError("Wiki page must be a regular file", 400);
  return readMarkdownFile(filePath, wikiFrontmatterSchema);
}

function versionOf(data: WikiFrontmatter, content: string) {
  return createHash("sha256")
    .update(JSON.stringify({ data, content }))
    .digest("hex");
}

export function getWikiEditorPage(slug: string): WikiEditorPage {
  const { data, content } = readPage(slug);
  return {
    slug,
    title: data.title ?? slug,
    category: data.category ?? "uncategorized",
    description: data.description ?? "",
    tags: parseTags(data.tags).filter((tag) => tag.trim() !== ""),
    lastUpdated: data.lastUpdated ?? "",
    content,
    version: versionOf(data, content),
    paper: readPaperFields(data),
  };
}

const wikiSaveSchema = z.object({
  slug: z.string().refine(isWikiEditorSlug),
  title: z
    .string()
    .max(200)
    .refine((title) => title.trim().length > 0),
  category: z.string().max(200),
  description: z.string().max(1000),
  tags: z.string().max(1000),
  content: z.string().max(2_000_000),
  create: z.boolean(),
  paper: z
    .object({
      authors: z.string().max(500),
      year: z.string().max(10),
      url: z.string().max(1000),
      read: z.string().max(40),
      source: z.string().max(100),
    })
    .partial()
    .optional(),
  version: z.unknown().optional(),
});

/** Synchronous read/compare/write keeps saves serialized in the local authoring server. */
export function saveWikiEditorPage(input: unknown): WikiEditorPage {
  const parsed = wikiSaveSchema.safeParse(input);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    throw new WikiEditError(
      field === "slug"
        ? WIKI_ADDRESS_ERROR
        : field === undefined
          ? "Invalid page"
          : "Invalid page fields",
      400
    );
  }
  const {
    slug,
    title,
    category,
    description,
    tags,
    content,
    create,
    version,
    paper,
  } = parsed.data;
  const filePath = wikiPath(slug);
  let existingData: WikiFrontmatter = {};
  if (create) {
    if (fs.existsSync(filePath))
      throw new WikiEditError("A wiki page already uses this address", 409);
  } else {
    if (typeof version !== "string")
      throw new WikiEditError("Page version required", 400);
    const existing = readPage(slug);
    if (versionOf(existing.data, existing.content) !== version)
      throw new WikiEditError(
        "This page changed since you opened it. Reload before saving so those changes are preserved.",
        409
      );
    existingData = existing.data;
  }
  // When the editor sends paper fields it owns them: cleared fields are removed.
  if (paper) {
    const { authors, year, url, read, source, ...rest } = existingData;
    existingData = rest;
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
        ...(paper ? paperFrontmatter(paper) : {}),
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
  return getWikiEditorPage(slug);
}
