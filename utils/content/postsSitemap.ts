import { postDateISO } from "@/utils/dateUtils";
import type { PostMetadata } from "@/types/post";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// lastmod is the post's own date, not the build time, so it only moves when
// the post does. Unparseable dates omit lastmod rather than guess.
export function buildPostsSitemap(
  siteUrl: string,
  posts: Pick<PostMetadata, "slug" | "date">[]
): string {
  const urls = posts.map(({ slug, date }) => {
    const lastmod = postDateISO(date);
    const loc = `<loc>${escapeXml(`${siteUrl}/posts/${slug}`)}</loc>`;
    return `  <url>${loc}${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}
