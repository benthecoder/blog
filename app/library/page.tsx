import fs from 'fs';
import Markdown from 'markdown-to-jsx';
import matter from 'gray-matter';

const LibraryPage = () => {
  const file = 'app/library/library.md';
  const content = fs.readFileSync(file, 'utf8');
  const library = matter(content);

  return (
    <div>
      <article className="prose">
        <Markdown>{library.content}</Markdown>
      </article>
    </div>
  );
};

export default LibraryPage;
