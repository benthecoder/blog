import { neon } from "@neondatabase/serverless";
import Form from "./form";
import RecentList from "./recent-list";
import { parseRows, tweetRowSchema } from "@/utils/thoughts";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL!);

export default async function Tweet() {
  const isDev = process.env.NODE_ENV !== "production";
  const recent = isDev
    ? parseRows(
        tweetRowSchema,
        await sql`
          SELECT id, content, link, link_title, created_at
          FROM tweets
          ORDER BY id DESC
          LIMIT 20
        `,
        "recent tweets"
      )
    : [];

  return (
    <section>
      <Form />
      {isDev && (
        <RecentList
          items={recent.map((t) => ({
            id: t.id,
            content: t.content,
            link: t.link,
            title: t.link_title,
          }))}
        />
      )}
    </section>
  );
}
