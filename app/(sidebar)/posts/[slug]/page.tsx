import { getPostContent, getPostMetadata } from "@/utils/content/posts";
import { getRelatedPosts } from "@/utils/content/related";
import { getPostPreviewData } from "@/utils/content/preview";
import { SITE_URL } from "@/config/site";
import RenderPost from "@/components/posts/RenderPost";
import MarkdownContent from "@/components/posts/MarkdownContent";
import { extractToc } from "@/utils/content/toc";
import { splitLeadingImage } from "@/utils/content/hero";
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
  const ogImage = `${SITE_URL}/og?title=${encodeURIComponent(title)}`;
  const description = getPostPreviewData(slug)?.excerpt.slice(0, 160);

  return {
    title,
    description,
    alternates: {
      canonical: `/posts/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url: `${SITE_URL}/posts/${slug}`,
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
  const { hero, body } = splitLeadingImage(postContent.content);
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
        toc={extractToc(postContent.content)}
        related={getRelatedPosts(slug)}
        hero={hero ? <MarkdownContent content={hero} /> : undefined}
      >
        <MarkdownContent content={body} />
      </RenderPost>
    </>
  );
};

export default PostPage;
