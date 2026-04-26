import fs from "fs";
import Markdown from "markdown-to-jsx";
import matter from "gray-matter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "start here",
  description: "who is benedict neo",
};

export const dynamic = "force-static";

const StartPage = () => {
  const file = "app/start/start.md";
  const content = fs.readFileSync(file, "utf8");
  const { content: body } = matter(content);

  return (
    <div>
      <article className="prose">
        <Markdown>{body}</Markdown>
      </article>
    </div>
  );
};

export default StartPage;
