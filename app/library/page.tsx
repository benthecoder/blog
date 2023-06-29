import fs from 'fs';
import Markdown from 'markdown-to-jsx';
import matter from 'gray-matter';

const GoalsPage = () => {
  const file = 'app/library/library.md';
  const content = fs.readFileSync(file, 'utf8');
  const goals = matter(content);

  return (
    <div>
      <article className='prose'>
        <Markdown>{goals.content}</Markdown>
      </article>
    </div>
  );
};

export default GoalsPage;
