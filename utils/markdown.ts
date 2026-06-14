import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface MarkdownFile {
  slug: string;
  data: Record<string, unknown>;
  content: string;
}

/** Read a single markdown file. Strips `orig` so the result is safe to pass to client components. */
export function readMarkdownFile(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { orig, ...result } = matter(raw);
  return result;
}

/** Scan a directory and return all `.md` files as parsed slug + frontmatter + content. */
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
