import getPostMetadata from '../../../components/getPostMetadata';
import PostPreview from '../../../components/PostPreview';

export const generateStaticParams = async () => {
  const postMetadata = getPostMetadata();

  const tags = new Set();

  postMetadata.forEach((post) => {
    post.tags.split(', ').forEach((tag) => tags.add(tag));
  });

  return Array.from(tags).map((tag: any) => ({
    slug: tag,
  }));
};

const TagPage = (props: any) => {
  const tag = props.params.slug;
  const postMetadata = getPostMetadata();

  const filteredPosts = postMetadata.filter((post) =>
    post.tags.split(', ').includes(tag)
  );

  const postPreviews = filteredPosts.map((post) => (
    <PostPreview key={post.slug} {...post} />
  ));

  return (
    <div>
      <h1 className='font-bold text-left mb-10 text-lg'> {tag}</h1>
      <div className='grid grid-cols-1'>{postPreviews}</div>
    </div>
  );
};

export default TagPage;
