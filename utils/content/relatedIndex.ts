import type { KnowledgeMapOutput } from "@/types/knowledgeMap";
export interface RelatedPost {
  slug: string;
  title: string;
  similarity: number;
}

export function buildRelatedIndex(
  map: KnowledgeMapOutput,
  limit = 4
): Map<string, RelatedPost[]> {
  const index = new Map<string, RelatedPost[]>();
  const add = (from: number, to: number, similarity: number) => {
    const source = map.data[from];
    const target = map.data[to];
    if (!source || !target || source.postSlug === target.postSlug) return;
    const posts = index.get(source.postSlug) ?? [];
    // Insert after existing equal scores to preserve the original stable sort.
    const position = posts.findIndex((post) => post.similarity < similarity);
    const insertion = position < 0 ? posts.length : position;
    if (insertion >= limit) return;
    posts.splice(insertion, 0, {
      slug: target.postSlug,
      title: target.postTitle,
      similarity,
    });
    if (posts.length > limit) posts.pop();
    index.set(source.postSlug, posts);
  };
  for (const [a, b, similarity] of map.similarityEdges) {
    add(a, b, similarity);
    add(b, a, similarity);
  }
  return index;
}
