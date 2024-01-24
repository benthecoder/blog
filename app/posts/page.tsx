import getPostMetadata from '../../utils/getPostMetadata';
import PostPreview from '../../components/PostPreview';
import Link from 'next/link';

const ArchivePage = () => {
  const postMetadata = getPostMetadata();

  let totalWordCount = 0;
  const totalBlogs = postMetadata.length;

  const postPreviews = postMetadata.map((post) => {
    totalWordCount += post.wordcount;
    return <PostPreview key={post.slug} {...post} />;
  });

  return (
    <div>
      <h1 className='font-bold text-left mb-6 text-2xl'> Archive</h1>

      <div className='grid grid-cols-1 text-sm'>
        <div className='flex flex-row space-x-2 mb-3'>
          <div>
            Filter by{' '}
            <Link href='/tags' className='underline'>
              tags
            </Link>
          </div>
          <div className='text-black-400'>•</div>
          <div>
            <Link href='/random' className='underline'>
              random
            </Link>{' '}
            🎲
          </div>
          <div className='text-black-400'>•</div>
          <div>
            <Link href='/search' className='underline'>
              search
            </Link>{' '}
            🔍
          </div>
        </div>

        <p className='text-green-900 text-sm mb-10'>
          Total: {totalBlogs} ({new Intl.NumberFormat().format(totalWordCount)}{' '}
          words)
        </p>
        {postPreviews}
      </div>
    </div>
  );
};

export default ArchivePage;
