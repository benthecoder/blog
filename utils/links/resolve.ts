import type { LinkableEntry, Resolver } from "@/types/links";

/** Normalize a title or slug for case/whitespace-insensitive matching. */
function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Build a resolver over the given entries. A bare `[[target]]` matches by
 * **title first, then slug**. On a duplicate key the first entry wins, so the
 * caller controls precedence by ordering `entries` (wiki before posts).
 */
export function createResolver(entries: LinkableEntry[]): Resolver {
  const byTitle = new Map<string, LinkableEntry>();
  const bySlug = new Map<string, LinkableEntry>();

  for (const entry of entries) {
    const titleKey = normalize(entry.title);
    if (titleKey && !byTitle.has(titleKey)) byTitle.set(titleKey, entry);
    const slugKey = normalize(entry.ref.slug);
    if (slugKey && !bySlug.has(slugKey)) bySlug.set(slugKey, entry);
  }

  return (target: string) => {
    const key = normalize(target);
    return byTitle.get(key) ?? bySlug.get(key) ?? null;
  };
}
