import type { PostFormat, PostFrontmatter } from "@/types/post";
import { formatOf, isPostFormat, POST_FORMATS } from "./formats";
import { parseTags } from "./tags";

// Explicit editorial picks: original, sustained reflections, not length or topic.
// Keep this migration list aligned with Ben's selected essays; never infer an
// essay from a favorite tag, a summary, or word count alone.
export const ESSAY_SLUGS = new Set([
  "311225",
  "281024",
  "2023",
  "311224",
  "curseddreams",
  "nightbefore",
  "isu",
  "strangers",
  "alone",
  "whyus",
  "240224",
  "exams",
]);

const removedTags = new Set<string>([
  ...POST_FORMATS.flatMap(({ legacyTags }) => [...legacyTags]),
  "✰",
]);

/**
 * Pre-migration frontmatter: `format` may hold a value the schema rejects,
 * and other keys pass through untouched.
 */
interface LegacyPostData {
  title?: string;
  tags?: PostFrontmatter["tags"];
  format?: unknown;
  [key: string]: unknown;
}

export function migrateFormat(slug: string, data: LegacyPostData) {
  if (data.format != null && !isPostFormat(data.format)) {
    throw new Error(`${slug}: unknown format ${JSON.stringify(data.format)}`);
  }
  const tags = parseTags(data.tags);
  let format: PostFormat | undefined = data.format ?? undefined;
  if (!format) {
    if (ESSAY_SLUGS.has(slug)) format = "essay";
    else if (
      /^sunday links\b/i.test(data.title ?? "") ||
      tags.includes("links")
    )
      format = "links";
    else if (tags.includes("book")) format = "book";
    else if (tags.includes("resources") || tags.includes("listicles"))
      format = "resource";
    else if (tags.includes("journal")) format = "journal";
  }
  const next = { ...data };
  // Date-named journals already have a default; avoid redundant format lines.
  if (format && (data.format || format !== formatOf(slug, {})))
    next.format = format;
  const removed = tags.filter((tag) => removedTags.has(tag));
  if (removed.length) {
    const topics = tags.filter((tag) => !removedTags.has(tag));
    if (topics.length)
      next.tags = Array.isArray(data.tags) ? topics : topics.join(", ");
    else delete next.tags;
  }
  return {
    data: next,
    format: formatOf(slug, next),
    removed,
    changed: JSON.stringify(data) !== JSON.stringify(next),
  };
}
