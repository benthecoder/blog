let inFlight: Promise<string[]> | null = null;

/**
 * Chronological slugs from /api/admin/list-posts, for prev/next links and
 * day/month shortcuts. Calls that overlap share one request.
 */
export function fetchPostOrder(): Promise<string[]> {
  inFlight ??= fetch("/api/admin/list-posts")
    .then((res) => (res.ok ? (res.json() as Promise<string[]>) : []))
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
