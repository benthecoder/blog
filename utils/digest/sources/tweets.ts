import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import type { LinkSource } from "../types";
import { parseRows, tweetRowSchema } from "@/utils/thoughts";

// `WHERE link IS NOT NULL` makes the link a string.
const linkedTweetSchema = tweetRowSchema
  .pick({ content: true, link_title: true, created_at: true })
  .extend({ link: z.string() });

// Thoughts that carry a link (posted via /tweet or the iOS shortcut). The
// thought text is the take.
export const tweets: LinkSource = {
  name: "tweets",
  async fetch(since, until) {
    const sql = neon(process.env.POSTGRES_URL!, {
      fetchOptions: { signal: AbortSignal.timeout(10_000) },
    });
    const rows = parseRows(
      linkedTweetSchema,
      await sql`
        SELECT content, link, link_title, created_at
        FROM tweets
        WHERE link IS NOT NULL AND created_at >= ${since.toISOString()}
          AND created_at < ${until.toISOString()}
        ORDER BY created_at
      `,
      "digest tweets"
    );

    return rows.map((r) => ({
      url: r.link,
      title: r.link_title ?? r.link,
      savedAt: r.created_at,
      highlights: [],
      take: r.content.trim() || undefined,
    }));
  },
};
