import { neon } from "@neondatabase/serverless";
import { fetchTitle } from "@/utils/tweets/link";
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

    // Titles aren't fetched on write, so resolve missing ones here.
    const titles = await Promise.all(
      rows.map((r) => r.link_title ?? fetchTitle(r.link))
    );

    return rows.map((r, i) => ({
      url: r.link,
      title: titles[i] ?? r.link,
      savedAt: new Date(r.created_at),
      highlights: [],
      take: r.content.trim() || undefined,
    }));
  },
};
