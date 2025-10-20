import fs from "fs";
import Markdown from "markdown-to-jsx";
import matter from "gray-matter";

const ProjectsPage = () => {
  const file = "app/projects/projects.md";
  const content = fs.readFileSync(file, "utf8");
  const project = matter(content);

  return (
    <div>
      <article className="prose">
        <Markdown>{project.content}</Markdown>
      </article>
    </div>
  );
};

export default ProjectsPage;
