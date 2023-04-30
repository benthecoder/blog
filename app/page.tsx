import MarkdownRender from '../components/RenderPost';
import Link from 'next/link';
import getPostMetadata from '../components/getPostMetadata';
import getPostContent from '../components/getPostContent';

const HomePage = () => {
  const posts = getPostMetadata();
  const topPosts = posts.slice(0, 10);

  const postPreview = topPosts.map((p) => {
    const post = getPostContent(p.slug);
    return MarkdownRender(post);
  });

  return (
    <div className='grid grid-cols-1 space-y-48'>
      {postPreview}

      <Link href='/posts' className='underline mt-10'>
        View the archives
      </Link>
    </div>
  );
};

export default HomePage;
