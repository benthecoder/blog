export interface HNStory {
  id: number;
  title: string;
  url: string;
  descendants?: number;
}

export const HN_POSTS_PER_PAGE = 50;
export const HN_MAX_PAGES = 10;
const API = "https://hacker-news.firebaseio.com/v0";

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(`${API}/${path}.json`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Hacker News returned ${response.status}`);
  return response.json();
}

export async function fetchHackerNewsPage(page: number): Promise<HNStory[]> {
  if (!Number.isInteger(page) || page < 0 || page >= HN_MAX_PAGES) {
    throw new Error("Invalid Hacker News page");
  }
  const ids = await fetchJson("topstories");
  if (!Array.isArray(ids)) throw new Error("Invalid Hacker News story list");
  const pageIds = ids.slice(
    page * HN_POSTS_PER_PAGE,
    (page + 1) * HN_POSTS_PER_PAGE
  );
  if (!pageIds.every((id) => Number.isSafeInteger(id) && id > 0)) {
    throw new Error("Invalid Hacker News story ID");
  }

  const stories = await Promise.all(
    pageIds.map(async (id): Promise<HNStory | null> => {
      const story = await fetchJson(`item/${id}`);
      if (story === null) return null;
      if (typeof story !== "object")
        throw new Error("Invalid Hacker News story");
      const item = story as Record<string, unknown>;
      if (item.deleted || item.dead) return null;
      if (item.id !== id || typeof item.title !== "string") {
        throw new Error("Invalid Hacker News story");
      }
      return {
        id,
        title: item.title,
        url:
          typeof item.url === "string" && item.url
            ? item.url
            : `https://news.ycombinator.com/item?id=${id}`,
        ...(typeof item.descendants === "number"
          ? { descendants: item.descendants }
          : {}),
      };
    })
  );
  return stories.filter((story): story is HNStory => story !== null);
}
