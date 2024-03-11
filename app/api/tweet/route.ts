import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(request) {
  const body = await request.json();
  const content = (body.body || '').slice(0, 700);

  try {
    const client = await pool.connect();
    const queryText = 'INSERT INTO tweets(content) VALUES($1) RETURNING *';
    const res = await client.query(queryText, [content]);
    client.release();
    return new Response(JSON.stringify({ error: null, tweet: res.rows[0] }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Error inserting tweet' }), {
      status: 500,
    });
  }
}

export async function DELETE(request) {
  const body = await request.json();
  const id = body.id;

  try {
    const client = await pool.connect();
    await client.query('DELETE FROM tweets WHERE id = $1', [id]);
    client.release();
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Error deleting tweet' }), {
      status: 500,
    });
  }
}
