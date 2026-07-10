import { getPostMetadata } from "@/utils/content/posts";
import PostPreview from "@/components/posts/PostPreview";

export const dynamic = "force-static";

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
  const tag = decodeURIComponent(params.slug);
  const filteredPosts = getPostMetadata().filter((post) =>
    post.tags.includes(tag)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 pb-4 border-b border-light-border dark:border-dark-tag">
        <p className="text-xs text-light-text/60 dark:text-dark-text/60 tracking-wide mb-2">
          TAG
        </p>
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold text-light-accent dark:text-dark-accent">
            {tag}
          </h1>
          <span className="text-sm text-light-text/40 dark:text-dark-text/40 font-mono tabular-nums">
            {filteredPosts.length}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 text-sm">
        {filteredPosts.map((post) => (
          <PostPreview key={post.slug} {...post} />
        ))}
      </div>
    </div>
  );
};

export default TagPage;
