import fs from 'fs';
import Markdown from 'markdown-to-jsx';
import matter from 'gray-matter';

const AboutPage = () => {
  const file = 'app/links/links.md';
  const content = fs.readFileSync(file, 'utf8');
  const about = matter(content);

  return (
    <div>
      <article className='prose prose-sm'>
        <Markdown>{about.content}</Markdown>
      </article>
    </div>
  );
};

export default AboutPage;
