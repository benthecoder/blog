import type { PostMetadata } from "@/types/post";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Local getters: frontmatter dates carry no timezone (see onThisDay.ts).
function toLastmod(date: string): string | null {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// lastmod is the post's own date, not the build time, so it only moves when
// the post does. Unparseable dates omit lastmod rather than guess.
export function buildPostsSitemap(
  siteUrl: string,
  posts: Pick<PostMetadata, "slug" | "date">[]
): string {
  const urls = posts.map(({ slug, date }) => {
    const lastmod = toLastmod(date);
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
