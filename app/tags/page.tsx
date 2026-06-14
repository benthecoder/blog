import Link from "next/link";
import getPostMetadata from "@/utils/getPostMetadata";

export const dynamic = "force-static";

const TagPage = () => {
  const postMetadata = getPostMetadata();

  const tags = postMetadata.reduce<Record<string, number>>((acc, post) => {
    post.tags.split(",").forEach((tag) => {
      const t = tag.trim();
      if (t) acc[t] = (acc[t] ?? 0) + 1;
    });
    return acc;
  }, {});

  const sortedTags = Object.keys(tags).sort((a, b) => tags[b] - tags[a]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-4">
        <p className="text-[10px] text-light-text/40 dark:text-dark-text/40 tracking-widest font-mono">
          {sortedTags.length} TAGS
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-0">
        {sortedTags.map((tag) => (
          <Link href={`/tags/${tag}`} key={tag}>
            <div className="group border border-light-border dark:border-dark-tag hover:bg-light-accent/5 dark:hover:bg-dark-accent/5 px-2 py-1.5 flex justify-between items-center gap-1.5 transition-colors">
              <span className="text-xs text-light-text dark:text-dark-text group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors truncate">
                {tag}
              </span>
              <span className="text-[10px] text-light-text/30 dark:text-dark-text/30 font-mono tabular-nums shrink-0">
                {tags[tag]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TagPage;
