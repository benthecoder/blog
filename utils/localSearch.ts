import type { SearchResultItem } from "@/types/search";
import { isStopword, searchTerms, termMatchers } from "./searchTerms";

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
    const terms = searchTerms(query);
    if (!terms.length) return [];
    const matchers = termMatchers(terms);
    const matches: { document: SearchDocument; score: number }[] = [];
    for (const entry of entries) {
      let score = 0;
      let matched = true;
      for (const [index, matcher] of matchers.entries()) {
        const inTags = matcher.test(entry.tags);
        if (tagsOnly) {
          if (!inTags) {
            matched = false;
            break;
          }
          score += 15;
        } else {
          const inTitle = matcher.test(entry.title);
          const inSlug = matcher.test(entry.slug);
          if (!inTitle && !inTags && !inSlug && !matcher.test(entry.body)) {
            matched = false;
            break;
          }
          // Function words must appear but say nothing about relevance.
          if (!isStopword(terms[index]))
            score += (inTitle ? 30 : 0) + (inTags ? 15 : 0) + (inSlug ? 10 : 0);
          score += 1;
        }
      }
      if (matched)
        matches.push({
          document: entry.document,
          score:
            score +
            (entry.title === phrase ? 100 : 0) +
            (terms.length > 1 && entry.body.includes(phrase) ? 50 : 0),
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
