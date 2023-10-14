import getPostMetadata from '../../components/getPostMetadata';
import PostPreview from '../../components/PostPreview';
import Link from 'next/link';

const getRandomPostSlug = () => {
  const postMetadata = getPostMetadata();
  const randomIndex = Math.floor(Math.random() * postMetadata.length);
  return postMetadata[randomIndex].slug;
};

const ArchivePage = () => {
  const postMetadata = getPostMetadata();
  const randomPostSlug = getRandomPostSlug();

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
        <div className='flex flex-row space-x-2 mb-10'>
          <div>
            Filter by{' '}
            <Link href='/tags' className='underline'>
              tags
            </Link>
          </div>
          <span>•</span>
          <div>
            <Link href={`/posts/${randomPostSlug}`} className='underline'>
              I'm feeling lucky
            </Link>
          </div>
        </div>

        {postPreviews}
      </div>
      <p className='text-green-900 mt-10 text-sm'>
        Total: {totalBlogs} ({totalWordCount} words)
      </p>
    </div>
  );
};

export default ArchivePage;
