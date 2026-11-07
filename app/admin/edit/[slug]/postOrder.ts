let inFlight: Promise<string[]> | null = null;

/**
 * Chronological slugs from /api/admin/list-posts. The editor's prev/next
 * links and DayNav both need it on mount; calls that overlap share one request.
 */
export function fetchPostOrder(): Promise<string[]> {
  inFlight ??= fetch("/api/admin/list-posts")
    .then((res) => (res.ok ? (res.json() as Promise<string[]>) : []))
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
