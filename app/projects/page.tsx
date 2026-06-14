import { readMarkdownFile } from "@/utils/markdown";
import MarkdownContent from "@/components/posts/MarkdownContent";

export const dynamic = "force-static";

const ProjectsPage = () => {
  const { content } = readMarkdownFile("app/projects/projects.md");

  return (
    <div>
      <article className="prose">
        <MarkdownContent content={content} />
      </article>
    </div>
  );
};

export default ProjectsPage;
