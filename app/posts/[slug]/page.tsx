import { getPostContent, getPostMetadata } from "@/utils/content/posts";
import RenderPost from "@/components/posts/RenderPost";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-static";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata | undefined> {
  const posts = getPostMetadata();
  const { slug } = await params;
  const post = posts.find((post) => post.slug === slug);

  if (!post) {
    return;
  }

  const { title, date: publishedTime } = post;
  const ogImage = `https://bneo.xyz/og?title=${title}`;

  return {
    title,
    openGraph: {
      title,
      type: "article",
      publishedTime,
      url: `https://bneo.xyz/posts/${slug}`,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [ogImage],
    },
  };
}

export const generateStaticParams = async () => {
  const posts = getPostMetadata();
  return posts.map((post) => ({
    slug: post.slug,
  }));
};

const PostPage = async ({ params }: { params: Params }) => {
  const posts = getPostMetadata();
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return notFound();
  }

  const postContent = getPostContent(slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.date,
    dateModified: post.date,
    url: `https://bneo.xyz/posts/${slug}`,
    author: {
      "@type": "Person",
      name: "Benedict Neo",
      url: "https://bneo.xyz",
    },
    wordCount: post.wordcount,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RenderPost
        post={postContent}
        prev={post.prev}
        next={post.next}
        slug={slug}
        wordcount={post.wordcount}
      />
    </>
  );
};

export default PostPage;
