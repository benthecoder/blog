import type { Thought } from "@/types/thoughts";

export async function fetchThoughtPage(
  cursor: number,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch
): Promise<Thought[]> {
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
  let previousId = cursor;
  for (const entry of data) {
    if (
      !entry ||
      typeof entry !== "object" ||
      !Number.isSafeInteger(entry.id) ||
      entry.id < 1 ||
      entry.id >= previousId ||
      typeof entry.content !== "string" ||
      typeof entry.created_at !== "string" ||
      !Number.isFinite(Date.parse(entry.created_at))
    ) {
      throw new Error("Invalid thoughts page");
    }
    previousId = entry.id;
  }
  return data as Thought[];
}
