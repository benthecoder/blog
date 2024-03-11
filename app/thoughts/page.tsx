import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function getTweets() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      'SELECT id, content, created_at FROM tweets ORDER BY created_at DESC LIMIT 1000'
    );
    return res.rows;
  } finally {
    client.release();
  }
}

export default async function ThoughtsPage() {
  let entries;

  try {
    entries = await getTweets();
  } catch (err) {
    console.error(err);
    entries = [];
  }

  return (
    <section>
      <h1 className='font-bold text-left mb-10 text-2xl'> Ben's Thoughts 💭</h1>
      {entries
        ? entries.map((entry: any) => (
            <div
              key={entry.id}
              className='flex flex-col mb-6 p-2 bg-blue-100 border-2 border-black dark:bg-gray-900 dark:border-white'
            >
              <div className='text-md text-gray-700 break-words dark:text-white'>
                {entry.content}
              </div>
              <div className='text-gray-500 mt-2 text-sm'>
                {new Date(entry.created_at).toLocaleString('en-GB', {
                  timeZone: 'Asia/Kuala_Lumpur', // change this to your timezone
                  hour: 'numeric',
                  hour12: false,
                  minute: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  year: '2-digit',
                })}
              </div>
            </div>
          ))
        : 'None'}
    </section>
  );
}
