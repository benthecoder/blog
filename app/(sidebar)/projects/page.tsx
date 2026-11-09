import { Metadata } from "next";
import { readMarkdownFile } from "@/utils/content/markdown";
import { bodyOnlySchema } from "@/utils/content/schemas";
import MarkdownContent from "@/components/posts/MarkdownContent";
import { PROJECTS_MD } from "@/config/paths";
import { pageMetadata } from "@/utils/pageMetadata";

// Hidden for now: out of the nav and search, but the page and its markdown
// stay so it can come back by restoring the nav entry.
export const metadata: Metadata = {
  ...pageMetadata({
    title: "projects",
    description: "things i've built",
    path: "/projects",
  }),
  robots: { index: false, follow: true },
};

export const dynamic = "force-static";

const ProjectsPage = () => {
  const { content } = readMarkdownFile(PROJECTS_MD, bodyOnlySchema);

  return (
    <div>
      <h1 className="sr-only">projects</h1>
      <article className="prose">
        <MarkdownContent content={content} />
      </article>
    </div>
  );
};

export default ProjectsPage;
