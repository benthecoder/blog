import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import AdminNavigation from "@/components/admin/AdminNavigation";
import { parseRows } from "@/utils/thoughts";

export const dynamic = "force-dynamic";

const messageRowSchema = z.object({
  id: z.number(),
  body: z.string(),
  sender: z.string().nullable(),
  created_at: z.union([z.string(), z.date()]),
});

const when = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/New_York",
});

export default async function MessagesPage() {
  const sql = neon(process.env.POSTGRES_URL!, {
    fetchOptions: { signal: AbortSignal.timeout(10_000) },
  });
  const rows = await sql`
    SELECT id, body, sender, created_at FROM messages
    ORDER BY created_at DESC LIMIT 500
  `;
  const messages = parseRows(messageRowSchema, rows, "messages");

  return (
    <div className="mx-auto max-w-2xl p-8">
      <AdminNavigation section="messages" />
      {messages.length === 0 ? (
        <p className="text-muted">no messages yet.</p>
      ) : (
        <ul className="space-y-8">
          {messages.map((message) => (
            <li key={message.id}>
              <p className="whitespace-pre-wrap text-primary">{message.body}</p>
              <p className="mt-2 text-xs text-muted">
                {message.sender ?? "anonymous"} ·{" "}
                {when.format(new Date(message.created_at))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
