import { PostFrontmatter } from "@/types/post";

export function extractTags(frontmatter: PostFrontmatter): string[] {
  const tagValue = frontmatter?.tags;
  if (!tagValue) return [];
  if (Array.isArray(tagValue)) return tagValue;
  if (typeof tagValue === "string")
    return tagValue.split(",").map((t) => t.trim());
  return [];
}

export function calculateWordCount(content: string): number {
  const withoutBlockquotes = content
    .split("\n")
    .filter((line) => !line.trim().startsWith(">"))
    .join("\n");
  return (withoutBlockquotes.match(/\b\w+\b/gu) || []).length;
}
