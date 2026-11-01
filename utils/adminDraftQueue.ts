import type { PostMetadata } from "@/types/post";

export type DraftSummary = Pick<PostMetadata, "slug" | "title" | "date">;

export function draftQueue(
  posts: Pick<PostMetadata, "slug" | "title" | "date" | "isDraft">[]
): DraftSummary[] {
  return posts
    .filter((post) => post.isDraft)
    .map(({ slug, title, date }) => ({ slug, title, date }))
    .sort(
      (a, b) =>
        (Date.parse(a.date) || 0) - (Date.parse(b.date) || 0) ||
        a.slug.localeCompare(b.slug)
    );
}

export function nextDraft(
  queue: DraftSummary[],
  slug: string,
  date: string
): DraftSummary | undefined {
  const current = queue.findIndex((post) => post.slug === slug);
  if (current >= 0)
    return queue[current + 1] ?? queue.find((post) => post.slug !== slug);
  return (
    queue.find((post) => Date.parse(post.date) > Date.parse(date)) ?? queue[0]
  );
}
