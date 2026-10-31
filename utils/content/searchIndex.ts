import { POSTS_DIR } from "@/config/paths";
import { scanMarkdownDir } from "./markdown";
import { extractTags } from "./tags";
import type { PostFrontmatter } from "@/types/post";
import type { SearchDocument } from "@/utils/localSearch";

/** Only published, top-level posts. Never scan the drafts directory. */
export function buildSearchDocuments(): SearchDocument[] {
  return scanMarkdownDir(POSTS_DIR).map(({ slug, data, content }) => ({
    post_slug: slug,
    post_title: typeof data.title === "string" ? data.title : slug,
    published_date: typeof data.date === "string" ? data.date : undefined,
    tags: extractTags(data as PostFrontmatter),
    content: content
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[<>]/g, "")
      .replace(/^```[^\n]*$/gm, "")
      .replace(/^#{1,6}\s+|^>\s?/gm, "")
      .replace(/`/g, "")
      .replace(
        /(^|\s)(\*{1,3}|_{1,3})(\S(?:[^\n]*?\S)?)\2(?=$|[\s.,!?;:])/gm,
        "$1$3"
      )
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  }));
}
