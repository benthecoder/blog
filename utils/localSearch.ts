import type { SearchResultItem } from "@/types/search";

export type SearchDocument = Pick<
  SearchResultItem,
  "post_slug" | "post_title" | "content" | "tags" | "published_date"
>;

/** Normalize once when loading the index, rather than on every keystroke. */
export function createLocalSearch(documents: SearchDocument[]) {
  const entries = documents.map((document) => ({
    document,
    title: document.post_title.toLocaleLowerCase(),
    tags: document.tags.join(" ").toLocaleLowerCase(),
    slug: document.post_slug.toLocaleLowerCase(),
    body: document.content.toLocaleLowerCase(),
  }));
  return (query: string, limit = 30): SearchResultItem[] => {
    const phrase = query.trim().toLocaleLowerCase().slice(0, 500);
    const tagsOnly = phrase.startsWith("#");
    const terms = [
      ...new Set(phrase.replace(/^#/, "").split(/\s+/).filter(Boolean)),
    ];
    if (!terms.length) return [];
    const matches: { document: SearchDocument; score: number }[] = [];
    for (const entry of entries) {
      let score = 0;
      let matched = true;
      for (const term of terms) {
        const inTags = entry.tags.includes(term);
        if (tagsOnly) {
          if (!inTags) {
            matched = false;
            break;
          }
          score += 15;
        } else {
          const inTitle = entry.title.includes(term);
          const inSlug = entry.slug.includes(term);
          if (!inTitle && !inTags && !inSlug && !entry.body.includes(term)) {
            matched = false;
            break;
          }
          score +=
            (inTitle ? 30 : 0) + (inTags ? 15 : 0) + (inSlug ? 10 : 0) + 1;
        }
      }
      if (matched)
        matches.push({
          document: entry.document,
          score: score + (entry.title === phrase ? 100 : 0),
        });
    }
    return matches
      .sort(
        (a, b) =>
          b.score - a.score ||
          (b.document.published_date ?? "").localeCompare(
            a.document.published_date ?? ""
          )
      )
      .slice(0, limit)
      .map(({ document, score }) => ({
        ...document,
        chunk_type: "full-post",
        score_type: "keyword",
        similarity: score,
      }));
  };
}

export type LocalSearch = ReturnType<typeof createLocalSearch>;
