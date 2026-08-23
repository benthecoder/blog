import type { ContentRef } from "@/types/links";

/**
 * Stable string key for a ContentRef, safe to use as a Map/Set key.
 * `{ kind: "wiki", slug: "kalman-filter" }` → `"wiki:kalman-filter"`.
 */
export function refKey(ref: ContentRef): string {
  return `${ref.kind}:${ref.slug}`;
}

export function refsEqual(a: ContentRef, b: ContentRef): boolean {
  return a.kind === b.kind && a.slug === b.slug;
}

/** Route for a ref. The one place kind → URL prefix is decided. */
export function hrefFor(ref: ContentRef): string {
  return ref.kind === "wiki" ? `/wiki/${ref.slug}` : `/posts/${ref.slug}`;
}
