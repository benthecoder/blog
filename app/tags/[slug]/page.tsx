import getPostMetadata from "@/utils/getPostMetadata";
import PostPreview from "@/components/PostPreview";

export const generateStaticParams = async () => {
  const postMetadata = await getPostMetadata();

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
  const postMetadata = await getPostMetadata();

  const filteredPosts = postMetadata.filter((post) =>
    post.tags.split(", ").includes(tag)
  );

  const postPreviews = filteredPosts.map((post) => (
    <PostPreview key={post.slug} {...post} />
  ));

  return (
    <div>
      <h1 className="font-bold text-left mb-10 text-lg"> Tag: {tag}</h1>
      <div className="grid grid-cols-1 text-sm">{postPreviews}</div>
    </div>
  );
};

export default TagPage;
