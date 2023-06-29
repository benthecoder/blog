import fs from 'fs';
import Markdown from 'markdown-to-jsx';
import matter from 'gray-matter';

const LinksPage = () => {
  const file = 'app/blogroll/blogroll.md';
  const content = fs.readFileSync(file, 'utf8');
  const about = matter(content);

  return (
    <div>
      <article className='prose'>
        <Markdown>{about.content}</Markdown>
      </article>
    </div>
  );
};

export default LinksPage;
