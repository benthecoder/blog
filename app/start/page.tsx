import { Metadata } from "next";
import { readMarkdownFile } from "@/utils/markdown";
import MarkdownContent from "@/components/posts/MarkdownContent";

export const metadata: Metadata = {
  title: "start here",
  description: "who is benedict neo",
};

export const dynamic = "force-static";

const StartPage = () => {
  const { content } = readMarkdownFile("app/start/start.md");

  return (
    <div>
      <article className="prose">
        <MarkdownContent content={content} />
      </article>
    </div>
  );
};

export default StartPage;
