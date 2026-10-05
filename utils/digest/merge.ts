import type { LinkItem } from "./types";

function key(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return (
      u.hostname.replace(/^www\./, "") +
      u.pathname.replace(/\/$/, "") +
      u.search
    ).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/** Collapse the same URL across sources into one item, newest first. */
export function mergeLinks(
  batches: { source: string; items: Omit<LinkItem, "sources">[] }[]
): LinkItem[] {
  const byUrl = new Map<string, LinkItem>();

  for (const { source, items } of batches) {
    for (const item of items) {
      const k = key(item.url);
      const prev = byUrl.get(k);
      if (!prev) {
        byUrl.set(k, { ...item, sources: [source] });
        continue;
      }
      prev.highlights = [...new Set([...prev.highlights, ...item.highlights])];
      prev.take = [prev.take, item.take].filter(Boolean).join(" ") || undefined;
      if (!prev.title || prev.title === prev.url) prev.title = item.title;
      if (item.savedAt > prev.savedAt) prev.savedAt = item.savedAt;
      if (!prev.sources.includes(source)) prev.sources.push(source);
    }
  }

  return [...byUrl.values()].sort(
    (a, b) => b.savedAt.getTime() - a.savedAt.getTime()
  );
}
