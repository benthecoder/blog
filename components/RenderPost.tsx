import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import rehypeRaw from 'rehype-raw';
import Image from 'next/image';

const RenderPost = ({ post, prev, next, slug }: any) => {
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag='div'
          className='rounded'
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    p: ({ node, children }: any) => {
      if (node.children[0].tagName === 'img') {
        const image: any = node.children[0];
        return (
          <div className='text-center'>
            <Image
              src={`${image.properties.src}`}
              alt={image.properties.alt}
              width='800'
              height='500'
            />
            <p className='text-gray-400 mt-0'>{image.properties.alt}</p>
          </div>
        );
      }
      return <p>{children}</p>;
    },
  };

  return (
    <div
      key={post.data.title}
      className='border-black border-double border-4 p-4 bg-stone-50'
    >
      {slug ? (
        <Link href={`/posts/${slug}`} className='mr-0'>
          <h2 className='font-bold text-2xl mb-12 text-center'>
            {post.data.title}
          </h2>
        </Link>
      ) : (
        <h2 className='font-bold text-2xl mb-12 text-center'>
          {post.data.title}
        </h2>
      )}
      <article className='prose'>
        <ReactMarkdown components={components} rehypePlugins={[rehypeRaw]}>
          {post.content}
        </ReactMarkdown>
      </article>
      <div className='flex justify-between items-center mt-12'>
        <div className='flex flex-wrap'>
          {post.data.tags.split(', ').map((tag: any) => (
            <Link
              href={`/tags/${tag}`}
              key={tag}
              className='mr-2 px-1 py-0.5 border-2 bg-gray-200 border-black border-double hover:bg-black hover:text-white hover:border-white hover:border-2'
            >
              #{tag}
            </Link>
          ))}
        </div>
        <p className='text-gray-400'>
          {new Date(post.data.date).toLocaleDateString()}
        </p>
      </div>
      {next && (
        <div className='mt-20 flex flex-col'>
          {next && (
            <div className='flex items-center'>
              <p className='text-gray-400'>Next:</p>
              <Link href={`/posts/${next.slug}`} className='ml-1 underline'>
                {next.title}
              </Link>
            </div>
          )}
          {prev && (
            <div className='flex items-center'>
              <p className='text-gray-400'>Previous:</p>
              <Link href={`/posts/${prev.slug}`} className='ml-1 underline'>
                {prev.title}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RenderPost;
