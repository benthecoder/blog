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
  const post = getPostContent(slug);
  return RenderPost(post);
};

export default PostPage;
