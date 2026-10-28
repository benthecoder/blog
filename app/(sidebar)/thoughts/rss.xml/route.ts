import { neon } from "@neondatabase/serverless";
import { buildThoughtsFeed } from "@/utils/content/thoughtsFeed";
import type { Thought } from "@/types/thoughts";

export const revalidate = 3600;

const sql = neon(process.env.POSTGRES_URL!);

export async function GET() {
  try {
    const thoughts = (await sql`
      SELECT id, content, link, link_title, created_at
      FROM tweets
      ORDER BY id DESC
      LIMIT 30
    `) as unknown as Thought[];
    return new Response(buildThoughtsFeed(thoughts), {
      headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
    });
  } catch {
    return new Response(null, {
      status: 500,
      statusText: "Internal Server Error",
      headers: { "Content-Type": "text/plain" },
    });
  }
}
