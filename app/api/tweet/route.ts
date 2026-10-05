import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

export const runtime = "edge";

import { parsePublicUrl } from "@/utils/tweets/link";

const URL_RE = /https?:\/\/[^\s]+/;

export async function POST(request: Request) {
  const body = await request.json();
  let content: string = (body.body || "").slice(0, 700);
  let link = typeof body.link === "string" ? parsePublicUrl(body.link) : null;

  // No explicit link: lift the first URL out of the text.
  if (!link) {
    const found = content.match(URL_RE);
    const parsed = found && parsePublicUrl(found[0]);
    if (found && parsed) {
      link = parsed;
      content = content.replace(found[0], "").replace(/\s+/g, " ").trim();
    }
  }

  // The server never fetches the link; the draft script resolves missing titles
  // locally. A client (e.g. the shortcut) may send one.
  const title =
    link && typeof body.title === "string"
      ? body.title.replace(/\s+/g, " ").trim().slice(0, 300) || null
      : null;

  try {
    const result =
      await sql`INSERT INTO tweets(content, link, link_title, created_at) VALUES(${content}, ${link}, ${title}, NOW()) RETURNING *`;
    return new Response(JSON.stringify({ error: null, tweet: result[0] }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Error inserting tweet" }), {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  // Local authoring only.
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 403 });
  }

  const body = await request.json();
  const id = body.id;

  try {
    await sql`DELETE FROM tweets WHERE id = ${id}`;
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Error deleting tweet" }), {
      status: 500,
    });
  }
}
