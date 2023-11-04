import getPostContent from '../../../components/getPostContent';
import getPostMetadata from '../../../components/getPostMetadata';
import RenderPost from '../../../components/RenderPost';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// Define an interface for the expected structure of `params`
interface Params {
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata | undefined> {
  const posts = getPostMetadata();
  const post = posts.find((post) => post.slug === params.slug);
  if (!post) {
    return;
  }

  const { title, date: publishedTime, slug } = post;
  const ogImage = `https://bneo.xyz/og?title=${title}`;

  return {
    title,
    openGraph: {
      title,
      type: 'article',
      publishedTime,
      url: `https://bneo.xyz/posts/${slug}`,
      images: [
        {
          url: ogImage,
        },
      ],
    },
  };
}

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
    return notFound();
  }

  const postContent = getPostContent(slug);

  return <RenderPost post={postContent} prev={post.prev} next={post.next} />;
};

export default PostPage;
