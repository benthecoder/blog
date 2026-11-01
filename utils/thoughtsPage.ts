import { z } from "zod";
import { thoughtJsonSchema, type Thought } from "@/utils/thoughts";

const pageSchema = z.array(thoughtJsonSchema).max(100);

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
  const page = pageSchema.safeParse(await response.json());
  if (!page.success) throw new Error("Invalid thoughts page");
  // Each page must continue strictly below the cursor, newest first.
  let previousId = cursor;
  for (const { id } of page.data) {
    if (id >= previousId) throw new Error("Invalid thoughts page");
    previousId = id;
  }
  return page.data;
}
