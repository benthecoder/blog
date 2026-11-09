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

export function scanMarkdownDir<S extends z.ZodType>(
  dir: string,
  schema: S
): (MarkdownFile<z.output<S>> & { slug: string })[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((fileName) => ({
      slug: fileName.replace(".md", ""),
      ...readMarkdownFile(path.join(dir, fileName), schema),
    }));
}
