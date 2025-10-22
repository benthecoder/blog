import getPostMetadata from "@/utils/getPostMetadata";
import PostPreview from "@/components/PostPreview";
import Link from "next/link";
import Heatmap from "@/components/Heatmap";

const ArchivePage = () => {
  const postMetadata = getPostMetadata();
  const currentYear = new Date().getFullYear();

  // Filter posts by current year by default
  const filteredPosts = postMetadata.filter(
    (post) => new Date(post.date).getFullYear() === currentYear
  );

  // Calculate overall totals
  let totalWordCount = 0;
  const totalPosts = postMetadata.length;
  postMetadata.forEach((post) => {
    totalWordCount += post.wordcount;
  });

  const postPreviews = filteredPosts.map((post) => {
    return <PostPreview key={post.slug} {...post} />;
  });

  return (
    <div>
      <h1 className="font-bold text-left mb-6 text-2xl hover:text-light-accent dark:hover:text-dark-accent transition-colors">
        {" "}
        archive
      </h1>

      <div className="grid grid-cols-1 text-sm">
        <div className="flex flex-row space-x-2 mb-3">
          <div>
            filter by{" "}
            <Link
              href="/tags"
              className="underline hover:text-light-accent dark:hover:text-dark-accent transition-colors"
            >
              tags
            </Link>
          </div>
          <div className="text-black-400">•</div>
          <div>
            <Link
              href="/search"
              className="underline hover:text-light-accent dark:hover:text-dark-accent transition-colors"
            >
              search
            </Link>{" "}
          </div>
          <div className="text-black-400">•</div>
          <Link
            href="/viz"
            className="underline hover:text-light-accent dark:hover:text-dark-accent transition-colors"
          >
            viz
          </Link>
        </div>

        <p className="text-japanese-sumiiro dark:text-japanese-murasakisuishiyou text-sm mb-4 font-medium">
          total: {totalPosts} entries (
          {new Intl.NumberFormat().format(totalWordCount)} words)
        </p>

        <br />

        <div className="mb-6">
          <Heatmap
            posts={postMetadata}
            year={currentYear}
            month={0}
            showNavigation={true}
            navigationPath="/posts"
          />
        </div>

        <div className="space-y-1 hover:space-y-2 transition-all duration-300">
          {postPreviews}
        </div>
      </div>
    </div>
  );
};

export default ArchivePage;
