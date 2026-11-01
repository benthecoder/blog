import type { ThoughtJson } from "@/utils/thoughts";

/**
 * Checks one /api/thoughts entry against the shape of thoughtJsonSchema.
 * Hand-written on purpose: this runs in the /thoughts client bundle, where
 * zod would add ~23 kB gzipped. utils/thoughtsPage.test.ts pins it to the
 * same cases the schema rejects.
 */
function isThoughtJson(entry: unknown): entry is ThoughtJson {
  if (
    !entry ||
    typeof entry !== "object" ||
    !("id" in entry) ||
    !("content" in entry) ||
    !("created_at" in entry) ||
    ("link" in entry &&
      entry.link !== undefined &&
      entry.link !== null &&
      typeof entry.link !== "string") ||
    ("link_title" in entry &&
      entry.link_title !== undefined &&
      entry.link_title !== null &&
      typeof entry.link_title !== "string")
  )
    return false;
  const { id, content, created_at } = entry;
  return (
    typeof id === "number" &&
    Number.isSafeInteger(id) &&
    id >= 1 &&
    typeof content === "string" &&
    typeof created_at === "string" &&
    Number.isFinite(Date.parse(created_at))
  );
}

export async function fetchThoughtPage(
  cursor: number | null,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
  query = ""
): Promise<ThoughtJson[]> {
  if (cursor !== null && (!Number.isSafeInteger(cursor) || cursor < 1))
    throw new Error("Invalid thoughts cursor");
  const params = new URLSearchParams();
  if (cursor !== null) params.set("cursor", String(cursor));
  params.set("limit", "100");
  if (query) params.set("q", query);
  const response = await fetcher(`/api/thoughts?${params}`, {
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
  let previousId = cursor ?? Infinity;
  for (const entry of entries) {
    if (!isThoughtJson(entry) || entry.id >= previousId)
      throw new Error("Invalid thoughts page");
    page.push(entry);
    previousId = entry.id;
  }
  return page;
}
