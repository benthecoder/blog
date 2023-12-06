import RenderPost from '../components/RenderPost';
import Link from 'next/link';
import getPostMetadata from '../components/getPostMetadata';
import getPostContent from '../components/getPostContent';
import Image from 'next/image';

const HomePage = () => {
  const posts = getPostMetadata();
  const topPosts = posts.slice(0, 10);

  const postPreview = topPosts.map((p) => {
    const post = getPostContent(p.slug);
    return (
      <div key={p.slug}>
        <RenderPost post={post} slug={p.slug} />
        <div className='flex justify-center my-10'>
          <Image src='dots.svg' width={20} height={10} alt='dots' />
        </div>
      </div>
    );
  });

  return (
    <div className='grid grid-cols-1'>
      {postPreview}
      <Link href='/posts' className='underline mt-10'>
        View the archives
      </Link>
    </div>
  );
};

export default HomePage;
