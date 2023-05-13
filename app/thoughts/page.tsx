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

  return (
    <section>
      <h1 className='font-bold text-left mb-10 text-2xl'> Ben's Thoughts 💭</h1>
      {entries
        ? entries.map((entry: any) => (
            <div key={entry.id} className='flex flex-col mb-4'>
              <div className='w-full break-words'>{entry.content}</div>
              <div className=' text-slate-400 text-sm'>
                {new Date(entry.created_at).toLocaleString('en-GB', {
                  timeZone: 'America/Chicago',
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
