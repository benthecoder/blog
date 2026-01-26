import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

export const runtime = "edge";

export async function POST(request: Request) {
  const body = await request.json();
  const content = (body.body || "").slice(0, 700);

  try {
    const result = await sql(
      "INSERT INTO tweets(content, created_at) VALUES($1, NOW()) RETURNING *",
      [content]
    );
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
  const body = await request.json();
  const id = body.id;

  try {
    await sql("DELETE FROM tweets WHERE id = $1", [id]);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Error deleting tweet" }), {
      status: 500,
    });
  }
}
