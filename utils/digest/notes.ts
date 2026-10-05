import { neon } from "@neondatabase/serverless";
import { getPostContent } from "@/utils/content/posts";
import type { PostMetadata } from "@/types/post";

const byDate = (a: PostMetadata, b: PostMetadata) =>
  new Date(a.date).getTime() - new Date(b.date).getTime();

function inRange(p: PostMetadata, since: Date, until: Date): boolean {
  const d = new Date(p.date);
  return d >= since && d < until;
}

function select(
  posts: PostMetadata[],
  since: Date,
  until: Date,
  keep: (p: PostMetadata) => boolean
): PostMetadata[] {
  return posts.filter((p) => inRange(p, since, until) && keep(p)).sort(byDate);
}

// These take the post list so a run parses the posts directory once.

/** `journal` posts in range, excluding the sunday links series. */
export const journalPosts = (posts: PostMetadata[], since: Date, until: Date) =>
  select(
    posts,
    since,
    until,
    (p) => p.tags.includes("journal") && !p.tags.includes("links")
  );

export const sundayLinksPosts = (
  posts: PostMetadata[],
  since: Date,
  until: Date
) => select(posts, since, until, (p) => /^sunday links/i.test(p.title));

export const monthlyPosts = (posts: PostMetadata[], since: Date, until: Date) =>
  select(posts, since, until, (p) => /^highlights\b/i.test(p.title));

/** Bullets under the `read` / `watch` headings at the foot of a weekly post. */
export function parseFooter(content: string, heading: "read" | "watch") {
  const out: string[] = [];
  let active = false;
  for (const line of content.split("\n")) {
    const h = line.trim().toLowerCase();
    if (h === "read" || h === "watch") {
      active = h === heading;
    } else if (active && /^- \S/.test(line)) {
      out.push(line.trim());
    }
  }
  return out;
}

export function footerLines(slug: string, heading: "read" | "watch") {
  return parseFooter(getPostContent(slug).content, heading);
}

/** Plain thoughts (no link) in range, oldest first. */
export async function thoughts(
  since: Date,
  until: Date
): Promise<{ at: Date; text: string }[]> {
  const sql = neon(process.env.POSTGRES_URL!);
  const rows = (await sql`
    SELECT content, created_at FROM tweets
    WHERE link IS NULL
      AND created_at >= ${since.toISOString()}
      AND created_at < ${until.toISOString()}
    ORDER BY created_at
  `) as { content: string; created_at: string }[];
  return rows.map((r) => ({ at: new Date(r.created_at), text: r.content }));
}
