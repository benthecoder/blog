import Markdown from 'markdown-to-jsx';
import Link from 'next/link';

const RenderPost = ({ ...post }) => {
  return (
    <div key={post.data.title}>
      <h2 className='font-bold text-left mb-4 text-2xl'>{post.data.title}</h2>
      <article className='prose'>
        <Markdown children={post.content} />
      </article>
      <div className='flex justify-between items-center pt-4 mt-5'>
        <div className='flex flex-wrap'>
          {post.data.tags.split(', ').map((tag: any) => (
            <Link
              href={`/tags/${tag}`}
              key={tag}
              className='mr-2 px-1 py-0.5 border rounded-lg border-black'
            >
              #{tag}
            </Link>
          ))}
        </div>
        <p className='text-gray-400'>
          {new Date(post.data.date).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default RenderPost;
