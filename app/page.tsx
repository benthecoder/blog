import fs from 'fs';
import matter from 'gray-matter';
import MarkdownRender from '../components/MarkdownRender';
import Link from 'next/link';

const HomePage = () => {
  const folder = 'posts/';
  const files = fs.readdirSync(folder);
  const markdownPosts = files.filter((file) => file.endsWith('.md'));

  const getDate = (fileName: String) => {
    const fileContents = fs.readFileSync(`posts/${fileName}`, 'utf8');
    const matterResult = matter(fileContents);

    return matterResult.data.date;
  };

  const sortedPosts = markdownPosts.sort((a, b) => {
    if (getDate(a) < getDate(b)) {
      return 1;
    } else {
      return -1;
    }
  });

  const topPosts = sortedPosts.slice(0, 10);

  const posts = topPosts.map((fileName) => {
    const fileContents = fs.readFileSync(`posts/${fileName}`, 'utf8');
    const matterResult = matter(fileContents);

    return (
      <div key={fileName}>
        <p className='font-bold text-left mb-3 text-lg'>
          {matterResult.data.title}
        </p>
        <article className='prose'>
          <MarkdownRender content={matterResult.content} />
        </article>
        <div className='flex flex-row space-x-2 mt-10 text-slate-600'>
          {matterResult.data.tags.split(', ').map((tag: any) => (
            <Link href={`/tags/${tag}`} key={tag}>
              #{tag}
            </Link>
          ))}
        </div>
        <p className='text-slate-400 mt-2'>{matterResult.data.date}</p>
      </div>
    );
  });

  return (
    <div className='grid grid-cols-1 space-y-48'>
      {posts}

      <Link href='/posts' className='underline mt-10'>
        View the archives
      </Link>
    </div>
  );
};

export default HomePage;
