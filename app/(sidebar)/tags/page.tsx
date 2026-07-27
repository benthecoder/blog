import Link from "next/link";
import { getPostMetadata } from "@/utils/content/posts";
import { countTagFrequency } from "@/utils/content/tags";

export const dynamic = "force-static";

const TagPage = () => {
  const sortedTags = countTagFrequency(getPostMetadata());

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-4">
        <p className="text-[10px] text-ink-strong/40 dark:text-chalk-strong/40 tracking-widest font-mono">
          {sortedTags.length} TAGS
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-0">
        {sortedTags.map(([tag, count]) => (
          <Link href={`/tags/${tag}`} key={tag}>
            <div className="group border border-rule dark:border-night-raised hover:bg-ink/5 dark:hover:bg-chalk-soft/5 px-2 py-1.5 flex justify-between items-center gap-1.5 transition-colors">
              <span className="text-xs text-ink-strong dark:text-chalk-strong group-hover:text-ink dark:group-hover:text-chalk-soft transition-colors truncate">
                {tag}
              </span>
              <span className="text-[10px] text-ink-strong/30 dark:text-chalk-strong/30 font-mono tabular-nums shrink-0">
                {count}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TagPage;
