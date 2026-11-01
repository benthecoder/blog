import type { Thought } from "@/types/thoughts";

export async function fetchThoughtPage(
  cursor: number | null,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
  query = ""
): Promise<Thought[]> {
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
  let previousId = cursor ?? Infinity;
  for (const entry of data) {
    if (
      !entry ||
      typeof entry !== "object" ||
      !Number.isSafeInteger(entry.id) ||
      entry.id < 1 ||
      entry.id >= previousId ||
      typeof entry.content !== "string" ||
      (entry.link !== undefined &&
        entry.link !== null &&
        typeof entry.link !== "string") ||
      (entry.link_title !== undefined &&
        entry.link_title !== null &&
        typeof entry.link_title !== "string") ||
      typeof entry.created_at !== "string" ||
      !Number.isFinite(Date.parse(entry.created_at))
    ) {
      throw new Error("Invalid thoughts page");
    }
    previousId = entry.id;
  }
  return data as Thought[];
}
