import { queryBuilder } from '../../lib/planetscale';

async function getGuestbook() {
  const data = await queryBuilder
    .selectFrom('tweets')
    .select(['id', 'content', 'created_at'])
    .orderBy('created_at', 'desc')
    .limit(1000)
    .execute();

  return data;
}

export const dynamic = 'force-dynamic';

export default async function GuestbookPage() {
  let entries;

  try {
    entries = await getGuestbook();
  } catch (err) {
    console.error(err);
  }

  // determine user timezone
  // const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <section>
      <h1 className='font-bold text-left mb-10 text-lg'> Ben's Thoughts 💭</h1>
      {entries
        ? entries.map((entry: any) => (
            <div key={entry.id} className='flex flex-col mb-4'>
              <div className='w-full  break-words'>{entry.content}</div>
              {/* format the date as 9:12 AM · Feb 17, 2023 */}
              <div className=' text-slate-400 text-sm'>
                {new Date(entry.created_at).toLocaleString('en-US', {
                  timeZone: 'America/Chicago',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true,
                })}
                {' · '}
                {new Date(entry.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          ))
        : 'None'}
    </section>
  );
}
