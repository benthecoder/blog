import { queryBuilder } from '../../lib/planetscale';

async function getTweets() {
  const data = await queryBuilder
    .selectFrom('tweets')
    .select(['id', 'content', 'created_at'])
    .orderBy('created_at', 'desc')
    .limit(1000)
    .execute();

  return data;
}

export default async function GuestbookPage() {
  let entries;

  try {
    entries = await getTweets();
  } catch (err) {
    console.error(err);
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
                  timeZone: 'America/Chicago', // change this to your timezone
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
