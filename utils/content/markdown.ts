import fs from "fs";
import path from "path";
import {
  parseFrontmatter,
  stringifyFrontmatter,
} from "@/utils/content/frontmatter";
import { writeAtomicFile } from "./atomicFile";

interface MarkdownFile {
  slug: string;
  data: Record<string, unknown>;
  content: string;
}

// Return only the parsed metadata and body, both serializable to clients.
export function readMarkdownFile(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8");
  return parseFrontmatter(raw);
}

/** Write a complete markdown file atomically; exclusive creates never replace a page. */
export function writeMarkdownFile(
  filePath: string,
  data: Record<string, unknown>,
  content: string,
  { exclusive = false }: { exclusive?: boolean } = {}
) {
  writeAtomicFile(filePath, stringifyFrontmatter(content, data), { exclusive });
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

export function scanMarkdownDir(dir: string): MarkdownFile[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((fileName) => {
      const { data, content } = parseFrontmatter(
        fs.readFileSync(path.join(dir, fileName), "utf8")
      );
      return { slug: fileName.replace(".md", ""), data, content };
    });
}
