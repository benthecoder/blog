import getPostMetadata from '../../components/getPostMetadata';
import PostPreview from '../../components/PostPreview';

const ArchivePage = () => {
  const postMetadata = getPostMetadata();
  const postPreviews = postMetadata.map((post) => (
    <PostPreview key={post.slug} {...post} />
  ));

  return (
    <div>
      <h1 className='font-bold text-left mb-10 text-lg'> Archive</h1>
      <div className='grid grid-cols-1'>{postPreviews}</div>
    </div>
  );
};

export default ArchivePage;
