import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import Form from "./form";
import RecentList from "./recent-list";
import type { Thought } from "@/types/thoughts";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL!);

export default async function Tweet() {
  if (process.env.NODE_ENV === "production") redirect("/thoughts");
  const recent = (await sql`
        SELECT id, content, link, link_title, created_at
        FROM tweets
        ORDER BY id DESC
        LIMIT 20
      `) as unknown as Thought[];

  return (
    <section>
      <Form />
      <RecentList
        items={recent.map((t) => ({
          id: t.id,
          content: t.content,
          link: t.link ?? null,
          title: t.link_title ?? null,
        }))}
      />
    </section>
  );
}
