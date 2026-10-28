import { SITE_URL } from "@/config/site";
import { getPostMetadata } from "@/utils/content/posts";
import { buildPostsSitemap } from "@/utils/content/postsSitemap";

export const dynamic = "force-static";

// Posts live here instead of next-sitemap's output so each <lastmod> is the
// post's own date rather than the build time. Listed in robots.txt.
export async function GET() {
  return new Response(buildPostsSitemap(SITE_URL, getPostMetadata()), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
