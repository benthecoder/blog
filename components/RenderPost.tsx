import Markdown from 'markdown-to-jsx';
import Link from 'next/link';

const RenderPost = ({ ...post }) => {
  return (
    <div key={post.data.title}>
      <p className='font-bold text-left mb-3 text-2xl'>{post.data.title}</p>
      <article className='prose'>
        <Markdown children={post.content} />
      </article>
      <div className='flex flex-row space-x-2 mt-10 text-green-900'>
        {post.data.tags.split(', ').map((tag: any) => (
          <Link href={`/tags/${tag}`} key={tag}>
            #{tag}
          </Link>
        ))}
      </div>
      <p className='text-slate-400 mt-2'>{post.data.date}</p>
    </div>
  );
};

export default RenderPost;
