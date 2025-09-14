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
      <h1 className="font-bold text-left mb-6 text-2xl hover:text-light-accent dark:hover:text-dark-accent transition-colors">
        {' '}
        Archive
      </h1>

      <div className="grid grid-cols-1 text-sm">
        <div className="flex flex-row space-x-2 mb-3">
          <div>
            Filter by{' '}
            <Link
              href="/tags"
              className="underline hover:text-light-accent dark:hover:text-dark-accent transition-colors"
            >
              tags
            </Link>
          </div>
          <div className="text-black-400">•</div>
          <div>
            <Link
              href="/random"
              className="underline hover:text-light-accent dark:hover:text-dark-accent transition-colors"
            >
              random
            </Link>{' '}
            🎲
          </div>
          <div className="text-black-400">•</div>
          <div>
            <Link
              href="/search"
              className="underline hover:text-light-accent dark:hover:text-dark-accent transition-colors"
            >
              search
            </Link>{' '}
            🔍
          </div>
        </div>

        <p className="text-japanese-sumiiro dark:text-japanese-murasakisuishiyou text-sm mb-10 font-medium">
          Total: {totalBlogs} ({new Intl.NumberFormat().format(totalWordCount)}{' '}
          words)
        </p>
        <div className="space-y-1 hover:space-y-2 transition-all duration-300">
          {postPreviews}
        </div>
      </div>
    </div>
  );
};

export default ArchivePage;
