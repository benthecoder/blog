import fs from 'fs';
import Markdown from 'markdown-to-jsx';
import matter from 'gray-matter';
import getPostMetadata from '../../../components/getPostMetadata';

const getPostContent = (slug: string) => {
  const folder = 'posts/';
  const file = `${folder}${slug}.md`;
  const content = fs.readFileSync(file, 'utf8');
  const matterResult = matter(content);
  return matterResult;
};

export const generateStaticParams = async () => {
  const posts = getPostMetadata();
  return posts.map((post) => ({
    slug: post.slug,
  }));
};

const PostPage = (props: any) => {
  const slug = props.params.slug;
  const post = getPostContent(slug);
  return (
    <div>
      <p className='font-bold font-serif text-left mb-10 text-lg'>
        {post.data.title}
      </p>
      <article className='prose'>
        <Markdown>{post.content}</Markdown>
      </article>
      <div className='flex flex-row space-x-2 mt-10'>
        {post.data.tags.split(', ').map((tag: string) => (
          <p className='underline'>{tag}</p>
        ))}
      </div>
      <p className='text-slate-400 mt-2'>{post.data.date}</p>
    </div>
  );
};

export default PostPage;
