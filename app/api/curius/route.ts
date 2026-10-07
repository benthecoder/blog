// Curius is public, mutable data. Cache successful responses at the CDN,
// rather than depending on implicit fetch defaults or caching upstream errors.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch("https://curius.app/api/users/2790/searchLinks", {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error("Curius request failed");
    const data: unknown = await res.json();
    return Response.json(
      { data },
      {
        headers: {
          "Cache-Control":
            "public, max-age=0, s-maxage=3600, stale-while-revalidate=60",
        },
      }
    );
  } catch {
    return Response.json(
      { error: "Failed to fetch bookmarks" },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
