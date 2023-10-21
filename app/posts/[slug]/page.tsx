import getPostContent from '../../../components/getPostContent';
import getPostMetadata from '../../../components/getPostMetadata';
import RenderPost from '../../../components/RenderPost';

export const generateStaticParams = async () => {
  const posts = getPostMetadata();
  return posts.map((post) => ({
    slug: post.slug,
  }));
};

const PostPage = (props: any) => {
  const slug = props.params.slug;
  const metadata = getPostMetadata();
  const post = metadata.find((p) => p.slug === slug);

  if (!post) {
    return <div>Post not found</div>;
  }

  const postContent = getPostContent(slug);

  return <RenderPost post={postContent} prev={post.prev} next={post.next} />;
};

export default PostPage;
