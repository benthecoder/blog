import type { ThoughtJson } from "@/utils/thoughts";

/**
 * Checks one /api/thoughts entry against the shape of thoughtJsonSchema.
 * Hand-written on purpose: this runs in the /thoughts client bundle, where
 * zod would add ~23 kB gzipped. utils/thoughtsPage.test.ts pins it to the
 * same cases the schema rejects.
 */
function isStringRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(
    ([key, title]) => typeof key === "string" && typeof title === "string"
  );
}

function isThoughtJson(entry: unknown): entry is ThoughtJson {
  if (
    !entry ||
    typeof entry !== "object" ||
    !("id" in entry) ||
    !("content" in entry) ||
    !("created_at" in entry)
  )
    return false;
  const { id, content, created_at, link, titles } = entry as {
    id: unknown;
    content: unknown;
    created_at: unknown;
    link?: unknown;
    titles?: unknown;
  };
  if (
    typeof id !== "number" ||
    !Number.isSafeInteger(id) ||
    id < 1 ||
    typeof content !== "string" ||
    typeof created_at !== "string" ||
    !Number.isFinite(Date.parse(created_at))
  )
    return false;
  if (link !== undefined && link !== null && typeof link !== "string")
    return false;
  if (titles !== undefined && !isStringRecord(titles)) return false;
  return true;
}

function normalizeThought(entry: ThoughtJson): ThoughtJson {
  return {
    id: entry.id,
    content: entry.content,
    link: entry.link ?? null,
    created_at: entry.created_at,
    titles: entry.titles ?? {},
  };
}

export async function fetchThoughtPage(
  cursor: number,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch
): Promise<ThoughtJson[]> {
  if (!Number.isSafeInteger(cursor) || cursor < 1)
    throw new Error("Invalid thoughts cursor");
  const response = await fetcher(`/api/thoughts?cursor=${cursor}&limit=100`, {
    signal,
  });
  if (!response.ok)
    throw new Error(`Thoughts request failed (${response.status})`);
  const data: unknown = await response.json();
  if (!Array.isArray(data) || data.length > 100)
    throw new Error("Invalid thoughts page");
  const entries: unknown[] = data;
  const page: ThoughtJson[] = [];
  // Each page must continue strictly below the cursor, newest first.
  let previousId = cursor;
  for (const entry of entries) {
    if (!isThoughtJson(entry) || entry.id >= previousId)
      throw new Error("Invalid thoughts page");
    page.push(normalizeThought(entry));
    previousId = entry.id;
  }
  return page;
}
