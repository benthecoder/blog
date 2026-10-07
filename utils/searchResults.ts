import type { SearchResultItem } from "@/types/search";

export function validateSearchResults(
  data: unknown
): SearchResultItem[] | null {
  if (!Array.isArray(data)) return null;
  if (
    !data.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        typeof item.content === "string" &&
        typeof item.post_slug === "string" &&
        typeof item.post_title === "string" &&
        ["full-post", "section", "quote", "code"].includes(item.chunk_type) &&
        ["hybrid", "semantic", "keyword"].includes(item.score_type) &&
        typeof item.similarity === "number" &&
        Number.isFinite(item.similarity) &&
        Array.isArray(item.tags) &&
        item.tags.every((tag: unknown) => typeof tag === "string") &&
        ["published_date", "section", "language"].every(
          (key) => item[key] === undefined || typeof item[key] === "string"
        )
    )
  )
    return null;
  return data;
}
