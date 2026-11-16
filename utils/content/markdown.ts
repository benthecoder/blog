import fs from "fs";
import path from "path";
import type { z } from "zod";
import {
  parseMarkdown,
  stringifyFrontmatter,
} from "@/utils/content/frontmatter";
import { writeAtomicFile } from "./atomicFile";

export interface MarkdownFile<Data> {
  data: Data;
  content: string;
}

/**
 * Read one file and validate its frontmatter against the content type's
 * schema (see ./schemas). Callers get typed data or a FrontmatterError that
 * names the file and field. Both parts are serializable to clients.
 */
export function readMarkdownFile<S extends z.ZodType>(
  filePath: string,
  schema: S
): MarkdownFile<z.output<S>> {
  return parseMarkdown(fs.readFileSync(filePath, "utf8"), schema, filePath);
}

/** Write a complete markdown file atomically; exclusive creates never replace a page. */
export function writeMarkdownFile(
  filePath: string,
  data: Record<string, unknown>,
  content: string,
  {
    exclusive = false,
    preserveBody = false,
  }: { exclusive?: boolean; preserveBody?: boolean } = {}
) {
  let markdown = stringifyFrontmatter(content, data);
  // Metadata-only migrations must not add a newline to an existing body.
  if (preserveBody && !content.endsWith("\n")) markdown = markdown.slice(0, -1);
  writeAtomicFile(filePath, markdown, { exclusive });
}

// Slugs only — a readdir with no file reads and no frontmatter parsing. Use
// this instead of scanMarkdownDir when the caller just needs to know what
// exists; parsing a thousand posts to pick one name is most of a request.
export function scanMarkdownSlugs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.slice(0, -".md".length));
}

// Deployed files on Vercel are immutable; cache directory scans per schema
// across modules (posts, links, quotes, papers, searchIndex) so a worker reads
// and parses the 1,085 markdown files once instead of five times.
const deployedDirCache = new Map<
  string,
  Map<z.ZodType, (MarkdownFile<unknown> & { slug: string })[]>
>();

const isImmutableDeployment = () =>
  process.env.NODE_ENV === "production" && process.env.VERCEL === "1";

const cloneEntries = <S extends z.ZodType>(
  entries: (MarkdownFile<unknown> & { slug: string })[]
): (MarkdownFile<z.output<S>> & { slug: string })[] =>
  entries.map((item) => ({
    ...item,
    data: { ...(item.data as Record<string, unknown>) } as z.output<S>,
  }));

export function scanMarkdownDir<S extends z.ZodType>(
  dir: string,
  schema: S
): (MarkdownFile<z.output<S>> & { slug: string })[] {
  if (!fs.existsSync(dir)) return [];
  const cacheable = isImmutableDeployment() && !dir.endsWith("drafts");
  if (cacheable) {
    const cached = deployedDirCache.get(dir)?.get(schema);
    if (cached) return cloneEntries(cached);
  }
  const entries = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((fileName) => ({
      slug: fileName.replace(".md", ""),
      ...readMarkdownFile(path.join(dir, fileName), schema),
    }));
  if (cacheable) {
    let bySchema = deployedDirCache.get(dir);
    if (!bySchema) {
      bySchema = new Map();
      deployedDirCache.set(dir, bySchema);
    }
    bySchema.set(schema, entries);
    return cloneEntries(entries);
  }
  return entries;
}
