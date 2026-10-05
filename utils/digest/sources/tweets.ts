import { neon } from "@neondatabase/serverless";
import type { LinkSource } from "../types";

// Thoughts that carry a link (posted via /tweet or the iOS shortcut). The
// thought text is the take.
export const tweets: LinkSource = {
  name: "tweets",
  async fetch(since, until) {
    const sql = neon(process.env.POSTGRES_URL!);
    const rows = (await sql`
      SELECT content, link, link_title, created_at
      FROM tweets
      WHERE link IS NOT NULL AND created_at >= ${since.toISOString()}
        AND created_at < ${until.toISOString()}
      ORDER BY created_at
    `) as {
      content: string;
      link: string;
      link_title: string | null;
      created_at: string;
    }[];

    return rows.map((r) => ({
      url: r.link,
      title: r.link_title ?? r.link,
      savedAt: new Date(r.created_at),
      highlights: [],
      take: r.content.trim() || undefined,
    }));
  },
};
