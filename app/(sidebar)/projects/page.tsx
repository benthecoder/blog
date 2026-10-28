import { Metadata } from "next";
import { readMarkdownFile } from "@/utils/content/markdown";
import MarkdownContent from "@/components/posts/MarkdownContent";
import { PROJECTS_MD } from "@/config/paths";
import { pageMetadata } from "@/utils/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "projects",
  description: "things i've built",
  path: "/projects",
});

export const dynamic = "force-static";

const ProjectsPage = () => {
  const { content } = readMarkdownFile(PROJECTS_MD);

  return (
    <div>
      <article className="prose">
        <MarkdownContent content={content} />
      </article>
    </div>
  );
};

export default ProjectsPage;
