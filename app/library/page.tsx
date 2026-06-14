import { readMarkdownFile } from "@/utils/content/markdown";
import MarkdownContent from "@/components/posts/MarkdownContent";
import { LIBRARY_MD } from "@/config/paths";

export const dynamic = "force-static";

const LibraryPage = () => {
  const { content } = readMarkdownFile(LIBRARY_MD);

  return (
    <div>
      <article className="prose">
        <MarkdownContent content={content} />
      </article>
    </div>
  );
};

export default LibraryPage;
