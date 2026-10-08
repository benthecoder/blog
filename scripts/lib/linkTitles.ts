import { extractTitle } from "@/utils/tweets/link";
import type { LinkItem } from "@/utils/digest/types";

const MAX_HTML_BYTES = 200_000;
const CONCURRENCY = 4;

// Imported only by the local draft CLI. Server source collection uses stored
// titles or URL fallbacks and never fetches arbitrary saved links.
async function fetchTitle(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "manual",
    });
    if (!response.ok || !response.body) {
      await response.body?.cancel().catch(() => {});
      return null;
    }
    const reader = response.body.getReader();
    try {
      const decoder = new TextDecoder();
      let html = "";
      let bytesRead = 0;
      while (bytesRead < MAX_HTML_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        const bytes = value.subarray(0, MAX_HTML_BYTES - bytesRead);
        bytesRead += bytes.length;
        html += decoder.decode(bytes, { stream: true });
        if (/<\/title>/i.test(html)) break;
      }
      return extractTitle(html);
    } finally {
      await reader.cancel().catch(() => {});
    }
  } catch {
    return null;
  }
}

/** Resolve missing tweet titles after merging sources, once per distinct URL. */
export async function resolveLinkTitles(
  links: LinkItem[]
): Promise<LinkItem[]> {
  const urls = [
    ...new Set(
      links
        .filter(
          (link) => link.sources.includes("tweets") && link.title === link.url
        )
        .map((link) => link.url)
    ),
  ];
  const titles = new Map<string, string | null>();
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, urls.length) }, async () => {
      while (next < urls.length) {
        const url = urls[next++];
        titles.set(url, await fetchTitle(url));
      }
    })
  );
  return links.map((link) =>
    link.sources.includes("tweets") && link.title === link.url
      ? { ...link, title: titles.get(link.url) ?? link.title }
      : link
  );
}
