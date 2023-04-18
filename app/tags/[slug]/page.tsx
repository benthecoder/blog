import getPostMetadata from '../../../components/getPostMetadata';
import PostPreview from '../../../components/PostPreview';

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
