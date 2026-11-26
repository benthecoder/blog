import { fetchTitle, TITLE_FETCH_CONCURRENCY } from "@/utils/tweets/fetchTitle";
import type { LinkItem } from "@/utils/digest/types";

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
    Array.from(
      { length: Math.min(TITLE_FETCH_CONCURRENCY, urls.length) },
      async () => {
        while (next < urls.length) {
          const url = urls[next++];
          titles.set(url, await fetchTitle(url));
        }
      }
    )
  );
  return links.map((link) =>
    link.sources.includes("tweets") && link.title === link.url
      ? { ...link, title: titles.get(link.url) ?? link.title }
      : link
  );
}
