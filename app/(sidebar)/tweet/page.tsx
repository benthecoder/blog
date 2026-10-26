import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminSession } from "@/utils/adminAuth";
import Form from "./form";
import RecentList from "./recent-list";
import type { Thought } from "@/types/thoughts";

export const dynamic = "force-dynamic";

const sql = neon(process.env.POSTGRES_URL!);

export default async function Tweet() {
  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev) {
    const secret = process.env.ADMIN_SECRET;
    const session = (await cookies()).get(ADMIN_COOKIE)?.value;
    if (!secret || !session || !verifyAdminSession(session, secret)) notFound();
  }
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
