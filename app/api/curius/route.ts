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
    const source = (await res.json()) as {
      links: {
        id: string | number;
        title: string;
        link: string;
        createdDate: string;
      }[];
    };
    // Snippets and crawler metadata dominate the upstream payload but are
    // unused by the public list. Preserve every link and its original order.
    const data = {
      links: source.links.map(({ id, title, link, createdDate }) => ({
        id,
        title,
        link,
        createdDate,
      })),
    };
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
