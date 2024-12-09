import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Image from 'next/image';
import remarkGfm from 'remark-gfm';

import 'katex/dist/katex.min.css';

const RenderPost = ({ post, prev, next, slug }: any) => {
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={dracula}
          language={match[1]}
          customStyle={{ border: 'none' }}
          PreTag="div"
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
          <div className="text-center">
            <Image
              src={`${image.properties.src}`}
              alt={image.properties.alt}
              width="800"
              height="500"
            />
            <p className="text-gray-400 text-xs mt-1">{image.properties.alt}</p>
          </div>
        );
      }

      return <p>{children}</p>;
    },
  };

  return (
    <div>
      <div
        key={post.data.title}
        className="p-4 bg-[#fffcf7] dark:bg-[#1a3c2f] rounded-lg shadow-md hover:shadow-lg transition-all duration-300 dark:text-[#e2e8f0] border-l-4 border-[#123524] dark:border-[#2f8259] hover:border-[#123524]/70 dark:hover:border-[#2f8259]/70"
      >
        {/* Title */}
        <div className="text-center">
          {slug ? (
            <Link href={`/posts/${slug}`}>
              <h2 className="font-bold text-xl md:text-2xl text-[#2c353d] dark:text-[#f1f5f9] hover:text-[#123524] dark:hover:text-[#7dd3fc] transition-colors duration-200">
                {post.data.title}
              </h2>
            </Link>
          ) : (
            <h2 className="font-bold text-xl md:text-2xl text-[#2c353d] dark:text-[#f1f5f9]">
              {post.data.title}
            </h2>
          )}

          {/* Date */}
          <p className="text-[#123524] dark:text-[#94a3b8] text-sm mt-2">
            {new Date(post.data.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Tags */}
        <div className="mt-2 flex flex-wrap justify-center gap-2 mb-4">
          {post.data.tags.split(', ').map((tag: any) => (
            <Link
              href={`/tags/${tag}`}
              key={tag}
              className="px-3 py-1 text-xs rounded-full bg-[#123524]/5 text-[#123524] hover:bg-[#123524] hover:text-white transition-colors duration-200 dark:bg-[#2f8259]/10 dark:text-[#2f8259] dark:hover:bg-[#2f8259] dark:hover:text-white"
            >
              #{tag}
            </Link>
          ))}
        </div>

        <hr className="border-[#123524] dark:border-[#2f8259] opacity-30 mb-3" />

        {/* Content */}
        <article className="prose dark:prose-invert dark:text-[#e2e8f0] text-sm md:text-base leading-relaxed max-w-none selection:bg-[#123524]/10 dark:selection:bg-[#2f8259]/20">
          <ReactMarkdown
            components={components}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
          >
            {post.content}
          </ReactMarkdown>
        </article>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex flex-col text-sm gap-1">
        {next && (
          <div className="flex group">
            <p className="text-[#123524] dark:text-[#2f8259]">Next:</p>
            <Link
              href={`/posts/${next.slug}`}
              className="ml-2 text-[#2c353d] dark:text-[#c7cce1] hover:text-[#123524] dark:hover:text-[#2f8259] transition-colors duration-200"
            >
              {next.title}
            </Link>
          </div>
        )}
        {prev && (
          <div className="flex group">
            <p className="text-[#123524] dark:text-[#2f8259]">Previous:</p>
            <Link
              href={`/posts/${prev.slug}`}
              className="ml-2 text-[#2c353d] dark:text-[#c7cce1] hover:text-[#123524] dark:hover:text-[#2f8259] transition-colors duration-200"
            >
              {prev.title}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RenderPost;
