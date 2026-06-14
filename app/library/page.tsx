import { readMarkdownFile } from "@/utils/markdown";
import MarkdownContent from "@/components/posts/MarkdownContent";

export const dynamic = "force-static";

const LibraryPage = () => {
  const { content } = readMarkdownFile("app/library/library.md");

  return (
    <div>
      <article className="prose">
        <MarkdownContent content={content} />
      </article>
    </div>
  );
};

export default LibraryPage;
