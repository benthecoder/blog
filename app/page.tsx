import getPostMetadata from '../components/getPostMetadata';
import PostPreview from '../components/PostPreview';

const HomePage = () => {
  const postMetadata = getPostMetadata();
  const postPreviews = postMetadata.map((post) => (
    <PostPreview key={post.slug} {...post} />
  ));

  return <div className='grid grid-cols-1'>{postPreviews}</div>;
};

export default HomePage;
