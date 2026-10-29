import { serializeJsonLd } from "@/utils/jsonLd";
import { getPostContent, getPostMetadata } from "@/utils/content/posts";
import { getRelatedPosts } from "@/utils/content/related";
import { getSameDayPosts } from "@/utils/content/onThisDay";
import { getPostPreviewData } from "@/utils/content/preview";
import data from "@/config/places.json";
import { placesSchema } from "@/utils/places";
import { placesForPost } from "@/utils/placesInPost";
import { postDateISO } from "@/utils/dateUtils";
import { SITE_URL } from "@/config/site";
import { PERSON_ID } from "@/config/person";
import RenderPost from "@/components/posts/RenderPost";
import MarkdownContent from "@/components/posts/MarkdownContent";
import Backlinks from "@/components/content/Backlinks";
import { extractToc } from "@/utils/content/toc";
import { splitLeadingImage } from "@/utils/content/hero";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const places = placesSchema.parse(data);

export const dynamic = "force-static";

const postOgImage = (title: string) =>
  `${SITE_URL}/og?title=${encodeURIComponent(title)}`;

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

  const { title } = post;
  const publishedTime = postDateISO(post.date);
  const ogImage = postOgImage(title);
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
      creator: "@benedictneo",
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
  const isoDate = postDateISO(post.date);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(isoDate && { datePublished: isoDate, dateModified: isoDate }),
    image: postOgImage(post.title),
    url: `https://bneo.xyz/posts/${slug}`,
    author: {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "Benedict Neo",
      url: "https://bneo.xyz/about",
    },
    wordCount: post.wordcount,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <RenderPost
        post={postContent}
        prev={post.prev}
        next={post.next}
        slug={slug}
        wordcount={post.wordcount}
        toc={extractToc(postContent.content)}
        related={getRelatedPosts(slug)}
        onThisDay={getSameDayPosts(slug)}
        onTheMap={placesForPost(places, slug)}
        hero={hero ? <MarkdownContent content={hero} /> : undefined}
        backlinks={<Backlinks contentRef={{ kind: "post", slug }} />}
      >
        <MarkdownContent content={body} />
      </RenderPost>
    </>
  );
};

export default PostPage;
