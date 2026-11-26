import { fetchTitles } from "@/utils/tweets/fetchTitle";
import { parsePublicUrl } from "@/utils/tweets/link";
import { bareContentUrls } from "@/utils/thoughtMarkdown";
import type { ThoughtRow, ThoughtView } from "@/utils/thoughts";

const TITLE_BUDGET_MS = 8000;
const FAILURE_TTL_MS = 30 * 60 * 1000;

type CacheEntry =
  { kind: "title"; title: string } | { kind: "miss"; at: number };

const memory = new Map<string, CacheEntry>();

export function clearTitleCache(): void {
  memory.clear();
}

function remembered(url: string): string | null | undefined {
  const entry = memory.get(url);
  if (!entry) return undefined;
  if (entry.kind === "title") return entry.title;
  if (Date.now() - entry.at < FAILURE_TTL_MS) return null;
  memory.delete(url);
  return undefined;
}

export type PersistTitles = (url: string, title: string) => Promise<void>;

/**
 * Attach a title map to each thought. Stored link_title values are used as-is.
 * Missing titles are fetched once, remembered in memory, and (for the thought's
 * own link) written back through \`persist\` so later requests skip the network.
 */
export async function resolveThoughtTitles(
  rows: ThoughtRow[],
  options: {
    fetcher?: typeof fetch;
    persist?: PersistTitles;
    now?: number;
  } = {}
): Promise<ThoughtView[]> {
  const fetcher = options.fetcher ?? fetch;
  const known = new Map<string, string>();

  const needed: string[] = [];
  for (const row of rows) {
    const link = row.link ? parsePublicUrl(row.link) : null;
    const stored = row.link_title?.replace(/\s+/g, " ").trim();
    if (link && stored) {
      known.set(link, stored.slice(0, 300));
      memory.set(link, { kind: "title", title: stored.slice(0, 300) });
    }
    const urls = [...(link ? [link] : []), ...bareContentUrls(row.content)];
    for (const url of urls) {
      if (known.has(url)) continue;
      const cached = remembered(url);
      if (cached) known.set(url, cached);
      else if (cached === undefined) needed.push(url);
    }
  }

  const uniqueNeeded = [...new Set(needed)];
  if (uniqueNeeded.length > 0) {
    const fetched = await fetchTitles(
      uniqueNeeded,
      fetcher,
      undefined,
      (options.now ?? Date.now()) + TITLE_BUDGET_MS
    );
    const toPersist: { url: string; title: string }[] = [];
    for (const [url, title] of fetched) {
      if (title) {
        known.set(url, title);
        memory.set(url, { kind: "title", title });
        toPersist.push({ url, title });
      } else {
        memory.set(url, { kind: "miss", at: options.now ?? Date.now() });
      }
    }
    if (options.persist) {
      await Promise.all(
        toPersist.map((item) =>
          options.persist!(item.url, item.title).catch(() => {})
        )
      );
    }
  }

  return rows.map((row) => {
    const link = row.link ? parsePublicUrl(row.link) : row.link;
    const titles: Record<string, string> = {};
    const urls = [...(link ? [link] : []), ...bareContentUrls(row.content)];
    for (const url of urls) {
      const title = known.get(url);
      if (title) titles[url] = title;
    }
    return {
      id: row.id,
      content: row.content,
      link,
      created_at: row.created_at,
      titles,
    };
  });
}
