import getPostMetadata from '../../components/getPostMetadata';
import PostPreview from '../../components/PostPreview';

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
      <h1 className='font-bold text-left mb-10 text-lg'> Archive</h1>
      <div className='grid grid-cols-1 text-sm'>{postPreviews}</div>
      <p className='text-green-900 mt-10 text-sm'>
        Total: {totalBlogs} ({totalWordCount} words)
      </p>
    </div>
  );
};

export default ArchivePage;
