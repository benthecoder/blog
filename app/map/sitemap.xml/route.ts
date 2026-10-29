import { buildUrlset } from "@/utils/urlset";

export const dynamic = "force-static";

// Served as maps.bneo.xyz/sitemap.xml (see rewrites in next.config.ts).
export function GET() {
  return new Response(buildUrlset(["https://maps.bneo.xyz"]), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
