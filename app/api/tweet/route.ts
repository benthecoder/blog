import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

export const runtime = "edge";

const URL_RE = /https?:\/\/[^\s]+/;

async function fetchTitle(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = (await res.text()).slice(0, 200_000);
    const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return m ? m[1].replace(/\s+/g, " ").trim().slice(0, 300) : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  let content: string = (body.body || "").slice(0, 700);
  let link: string | null =
    typeof body.link === "string" && body.link.trim() ? body.link.trim() : null;

  // No explicit link: lift the first URL out of the text.
  if (!link) {
    const found = content.match(URL_RE);
    if (found) {
      link = found[0];
      content = content.replace(found[0], "").replace(/\s+/g, " ").trim();
    }
  }

  const title = link ? await fetchTitle(link) : null;

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
