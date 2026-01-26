import getPostMetadata from "@/utils/getPostMetadata";
import PostPreview from "@/components/posts/PostPreview";

export const revalidate = 3600; // Cache for 1 hour

export const generateStaticParams = async () => {
  const postMetadata = getPostMetadata();

  const tags = new Set();

  postMetadata.forEach((post) => {
    post.tags.split(", ").forEach((tag) => tags.add(tag));
  });

  return Array.from(tags).map((tag: any) => ({
    slug: tag,
  }));
};

const TagPage = async (props: any) => {
  const params = await props.params;
  const tag = decodeURIComponent(params.slug);
  const postMetadata = getPostMetadata();

  const filteredPosts = postMetadata.filter((post) =>
    post.tags.split(", ").includes(tag)
  );

  const postPreviews = filteredPosts.map((post) => (
    <PostPreview key={post.slug} {...post} />
  ));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
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

      {/* Posts */}
      <div className="grid grid-cols-1 text-sm">{postPreviews}</div>
    </div>
  );
};

export default TagPage;
