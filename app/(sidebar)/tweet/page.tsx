import { neon } from "@neondatabase/serverless";
import Form from "./form";
import RecentList from "./recent-list";
import type { Thought } from "@/types/thoughts";

// Run beside Neon (us-east-2): the project default region is sin1, and every
// query from Singapore crosses the Pacific twice. Must stay a literal.
export const preferredRegion = "iad1";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL!);

export default async function Tweet() {
  const isDev = process.env.NODE_ENV !== "production";
  const recent = isDev
    ? ((await sql`
        SELECT id, content, link, link_title, created_at
        FROM tweets
        ORDER BY id DESC
        LIMIT 20
      `) as unknown as Thought[])
    : [];

  return (
    <section>
      <Form />
      {isDev && (
        <RecentList
          items={recent.map((t) => ({
            id: t.id,
            content: t.content,
            link: t.link ?? null,
            title: t.link_title ?? null,
          }))}
        />
      )}
    </section>
  );
}
