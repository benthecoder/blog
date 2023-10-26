import Markdown from 'markdown-to-jsx';
import Link from 'next/link';

const RenderPost = ({ post, prev, next, slug }: any) => {
  return (
    <div key={post.data.title}>
      <Link href={`/posts/${slug}`} className='mr-0'>
        <h2 className='font-bold text-2xl'>{post.data.title}</h2>
      </Link>
      <article className='prose'>
        <Markdown children={post.content} />
      </article>
      <div className='flex justify-between items-center pt-4 mt-5'>
        <div className='flex flex-wrap'>
          {post.data.tags.split(', ').map((tag: any) => (
            <Link
              href={`/tags/${tag}`}
              key={tag}
              className='mr-2 px-1 py-0.5 border rounded-lg border-black hover:bg-black hover:text-white transition-all'
            >
              #{tag}
            </Link>
          ))}
        </div>
        <p className='text-gray-400'>
          {new Date(post.data.date).toLocaleDateString()}
        </p>
      </div>
      <div className='mt-32 flex flex-col'>
        {next && (
          <div className='flex items-center'>
            <p className='w-24 text-gray-400'>Next:</p>
            <Link href={`/posts/${next.slug}`} className='mr-4 underline'>
              {next.title}
            </Link>
          </div>
        )}
        {prev && (
          <div className='flex items-center'>
            <p className='w-24 text-gray-400'>Previous:</p>
            <Link href={`/posts/${prev.slug}`} className='mr-4 underline'>
              {prev.title}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RenderPost;
