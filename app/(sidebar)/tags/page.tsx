import type { Metadata } from "next";
import TagDirectory from "@/components/posts/TagDirectory";
import { getPostMetadata } from "@/utils/content/posts";
import { countTagFrequency } from "@/utils/content/tags";
import { pageMetadata } from "@/utils/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "tags",
  path: "/tags",
});

export const dynamic = "force-static";

const TagPage = () => {
  const sortedTags = countTagFrequency(getPostMetadata());

  return (
    <div>
      <h1 className="sr-only">tags</h1>
      <div className="mb-4">
        <p className="text-[10px] text-primary/40 tracking-widest font-mono">
          {sortedTags.length} tags
        </p>
      </div>

      <TagDirectory tags={sortedTags} />
    </div>
  );
};

export default TagPage;
