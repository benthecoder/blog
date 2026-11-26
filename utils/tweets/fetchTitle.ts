import { extractTitle, parsePublicUrl } from "./link";

const MAX_HTML_BYTES = 200_000;
export const TITLE_FETCH_CONCURRENCY = 4;
const FETCH_TIMEOUT_MS = 4000;
const MAX_REDIRECTS = 3;

/**
 * Fetches a public URL and reads enough of the document to pick a title.
 * Redirects are followed only to other public http(s) URLs, so a 302 cannot
 * be used to probe an internal host.
 */
export async function fetchTitle(
  url: string,
  fetcher: typeof fetch = fetch
): Promise<string | null> {
  let current = parsePublicUrl(url);
  if (!current) return null;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    try {
      const response = await fetcher(current, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { "User-Agent": "Mozilla/5.0" },
        redirect: "manual",
      });

      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel().catch(() => {});
        const location = response.headers.get("location");
        if (!location) return null;
        let next: string;
        try {
          next = new URL(location, current).toString();
        } catch {
          return null;
        }
        const publicNext = parsePublicUrl(next);
        if (!publicNext) return null;
        current = publicNext;
        continue;
      }

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
          // og:title usually lives in <head>, often after <title>.
          if (/<\/head>|<body\b/i.test(html)) break;
        }
        html += decoder.decode();
        return extractTitle(html);
      } finally {
        await reader.cancel().catch(() => {});
      }
    } catch {
      return null;
    }
  }
  return null;
}

/** Resolve titles for distinct URLs, keeping `concurrency` workers busy. */
export async function fetchTitles(
  urls: string[],
  fetcher: typeof fetch = fetch,
  concurrency = TITLE_FETCH_CONCURRENCY,
  deadline = Infinity
): Promise<Map<string, string | null>> {
  const unique = [...new Set(urls)];
  const titles = new Map<string, string | null>();
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, unique.length) }, async () => {
      while (next < unique.length) {
        if (Date.now() >= deadline) return;
        const url = unique[next++];
        titles.set(url, await fetchTitle(url, fetcher));
      }
    })
  );
  return titles;
}
