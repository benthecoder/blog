import { formatForLegacyTag } from "@/utils/content/formats";
import { canonicalTopicTag } from "@/utils/content/tags";
import { legacyTravelDestination, travelPlaceId } from "@/utils/content/travel";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getPostMetadata } from "@/utils/content/posts";
import PostList from "@/components/posts/PostList";
import Link from "next/link";
import { tryDecodeUrlComponent } from "@/utils/links/url";
import { pageMetadata } from "@/utils/pageMetadata";

export const dynamic = "force-static";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  return pageMetadata({
    title: `#${tryDecodeUrlComponent(slug) ?? slug}`,
    path: `/tags/${slug}`,
  });
}

export const generateStaticParams = async () => {
  const postMetadata = getPostMetadata();
  const tags = new Set<string>();
  postMetadata.forEach((post) => {
    post.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).map((tag) => ({ slug: tag }));
};

const TagPage = async (props: { params: Promise<{ slug: string }> }) => {
  const params = await props.params;
  // This version passes encoded segments during fallback rendering. Keep the
  // existing one-decode behavior, but do not throw on a literal percent sign.
  const tag = tryDecodeUrlComponent(params.slug) ?? params.slug;
  const format = formatForLegacyTag(tag);
  if (format) permanentRedirect(`/posts?view=${format}`);
  const destination = legacyTravelDestination(tag);
  if (destination)
    permanentRedirect(`/posts?view=places#${travelPlaceId(destination)}`);
  const canonical = canonicalTopicTag(tag);
  if (
    canonical !== tag &&
    getPostMetadata().some((post) => post.tags.includes(canonical))
  )
    permanentRedirect(`/tags/${encodeURIComponent(canonical)}`);
  const filteredPosts = getPostMetadata().filter((post) =>
    post.tags.includes(tag)
  );
  // Any slug renders here, so an unknown tag must 404 rather than show an
  // empty page with a 200. A different-case spelling of a real tag
  // (/tags/sf for SF) redirects to it instead.
  if (filteredPosts.length === 0) {
    const lower = tag.toLowerCase();
    const match = getPostMetadata()
      .flatMap((post) => post.tags)
      .find((t) => t.toLowerCase() === lower);
    if (match) permanentRedirect(`/tags/${encodeURIComponent(match)}`);
    notFound();
  }

  return (
    <div>
      <header className="mb-8">
        <Link href="/tags" className="text-sm text-muted hover:text-accent">
          all tags →
        </Link>
        <h1 className="mt-4 text-base font-bold text-primary">
          #{tag}{" "}
          <span className="font-normal text-muted text-xs">
            · {filteredPosts.length}
          </span>
        </h1>
      </header>
      <PostList posts={filteredPosts} />
    </div>
  );
};

export default TagPage;
