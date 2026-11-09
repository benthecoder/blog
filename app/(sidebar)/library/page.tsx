import { Metadata } from "next";
import { readMarkdownFile } from "@/utils/content/markdown";
import { bodyOnlySchema } from "@/utils/content/schemas";
import MarkdownContent from "@/components/posts/MarkdownContent";
import { LIBRARY_MD } from "@/config/paths";
import { pageMetadata } from "@/utils/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "library",
  description: "books i've read",
  path: "/library",
});

export const dynamic = "force-static";

const LibraryPage = () => {
  const { content } = readMarkdownFile(LIBRARY_MD, bodyOnlySchema);

  return (
    <div>
      <h1 className="sr-only">library</h1>
      <article className="prose">
        <MarkdownContent content={content} />
      </article>
    </div>
  );
};

export default LibraryPage;
