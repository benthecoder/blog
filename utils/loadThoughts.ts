import "server-only";
import { neon } from "@neondatabase/serverless";
import {
  parseRows,
  thoughtRowSchema,
  type ThoughtView,
} from "@/utils/thoughts";
import { resolveThoughtTitles } from "@/utils/thoughtTitles";

const DEFAULT_TIMEOUT_MS = 10_000;

function connect(signal?: AbortSignal) {
  const signals = [
    AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    ...(signal ? [signal] : []),
  ];
  return neon(process.env.POSTGRES_URL!, {
    fetchOptions: { signal: AbortSignal.any(signals) },
  });
}

function persistTitle(
  sql: ReturnType<typeof connect>
): (url: string, title: string) => Promise<void> {
  return async (url, title) => {
    await sql`
      UPDATE tweets
      SET link_title = ${title}
      WHERE link = ${url} AND (link_title IS NULL OR link_title = '')
    `;
  };
}

export async function loadThoughts(options: {
  cursor?: number | null;
  limit: number;
  signal?: AbortSignal;
}): Promise<ThoughtView[]> {
  const { cursor = null, limit, signal } = options;
  const sql = connect(signal);
  const rows = parseRows(
    thoughtRowSchema,
    cursor !== null
      ? await sql`
          SELECT id, content, link, link_title, created_at
          FROM tweets
          WHERE id < ${cursor}
          ORDER BY id DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT id, content, link, link_title, created_at
          FROM tweets
          ORDER BY id DESC
          LIMIT ${limit}
        `,
    "thoughts"
  );

  return resolveThoughtTitles(rows, { persist: persistTitle(sql) });
}

export async function loadThought(
  id: number,
  signal?: AbortSignal
): Promise<ThoughtView | null> {
  const sql = connect(signal);
  const rows = parseRows(
    thoughtRowSchema,
    await sql`
      SELECT id, content, link, link_title, created_at
      FROM tweets
      WHERE id = ${id}
      LIMIT 1
    `,
    "thought"
  );
  if (rows.length === 0) return null;
  const [thought] = await resolveThoughtTitles(rows, {
    persist: persistTitle(sql),
  });
  return thought ?? null;
}
