import { Metadata } from "next";
import { readMarkdownFile } from "@/utils/content/markdown";
import MarkdownContent from "@/components/posts/MarkdownContent";
import { START_MD } from "@/config/paths";

export const metadata: Metadata = {
  title: "start here",
  description: "who is benedict neo",
};

export const dynamic = "force-static";

const StartPage = () => {
  const { content } = readMarkdownFile(START_MD);

  return (
    <div>
      <article className="prose">
        <MarkdownContent content={content} />
      </article>
    </div>
  );
};

export default StartPage;
