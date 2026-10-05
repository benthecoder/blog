import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { randomUUID } from "crypto";

interface MarkdownFile {
  slug: string;
  data: Record<string, unknown>;
  content: string;
}

// Strips `orig` (Uint8Array) so the result is serializable to client components.
export function readMarkdownFile(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { orig, ...result } = matter(raw);
  return result;
}

/** Write a complete markdown file atomically; exclusive creates never replace a page. */
export function writeMarkdownFile(
  filePath: string,
  data: Record<string, unknown>,
  content: string,
  { exclusive = false }: { exclusive?: boolean } = {}
) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
  const temporaryPath = path.join(directory, `.${randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporaryPath, matter.stringify(content, data), "utf8");
    if (exclusive) fs.linkSync(temporaryPath, filePath);
    else fs.renameSync(temporaryPath, filePath);
  } finally {
    fs.rmSync(temporaryPath, { force: true });
  }
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
      const { data, content } = matter(
        fs.readFileSync(path.join(dir, fileName), "utf8")
      );
      return { slug: fileName.replace(".md", ""), data, content };
    });
}
