import { neon, neonConfig } from '@neondatabase/serverless';

interface Tweet {
  id: number;
  content: string;
  created_at: Date;
}

// Assuming you've set NEON_DATABASE_URL in your environment variables
const sql = neon(process.env.DATABASE_URL!);

async function getTweets(): Promise<Tweet[]> {
  // Construct your SQL query
  const query = `
    SELECT id, content, created_at 
    FROM tweets 
    ORDER BY created_at DESC 
    LIMIT 1000
  `;

  // Execute the query using the Neon serverless driver
  try {
    // Attempting a type assertion here. Note: This assumes that the sql function can return any.
    const result = (await sql(query)) as unknown as Tweet[];
    return result;
  } catch (error) {
    console.error('Error fetching tweets:', error);
    throw error;
  }
}

export default async function ThoughtsPage() {
  let entries: Tweet[] = [];

  try {
    const result = await getTweets();
    entries = result; // Assuming the result is directly usable as your entries
  } catch (err) {
    console.error(err);
    entries = [];
  }

  return (
    <section>
      <h1 className='font-bold text-left mb-10 text-2xl'> Ben's Thoughts 💭</h1>
      {entries.length > 0
        ? entries.map((entry) => (
            <div
              key={entry.id}
              className='flex flex-col mb-6 p-2 bg-blue-100 border-2 border-black dark:bg-gray-900 dark:border-white'
            >
              <div className='text-md text-gray-700 break-words dark:text-white'>
                {entry.content}
              </div>
              <div className='text-gray-500 mt-2 text-sm'>
                {new Date(entry.created_at).toLocaleString('en-GB', {
                  timeZone: 'Asia/Kuala_Lumpur',
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

neonConfig.fetchConnectionCache = false;
export const runtime = 'edge';
