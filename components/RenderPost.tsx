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
        className="p-4 bg-gradient-to-br from-japanese-hakuji to-japanese-unoharairo dark:from-gray-900 dark:to-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 dark:text-japanese-nyuhakushoku border-l-4 border-japanese-soshoku dark:border-japanese-murasakisuishiyou hover:border-japanese-nezumiiro dark:hover:border-japanese-shironezu/70"
      >
        {/* Title */}
        <div className="text-center">
          {slug ? (
            <Link href={`/posts/${slug}`}>
              <h2 className="font-bold text-xl md:text-2xl text-japanese-sumiiro dark:text-japanese-nyuhakushoku hover:text-japanese-sumiiro/80 dark:hover:text-japanese-shironezu transition-colors duration-200">
                {post.data.title}
              </h2>
            </Link>
          ) : (
            <h2 className="font-bold text-xl md:text-2xl text-japanese-sumiiro dark:text-japanese-nyuhakushoku">
              {post.data.title}
            </h2>
          )}

          {/* Date */}
          <p className="text-japanese-nezumiiro/80 dark:text-japanese-murasakisuishiyou/60 text-sm mt-2 font-light tracking-wide">
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
              className="px-3 py-1 text-xs rounded-full bg-gradient-to-r from-japanese-soshoku/20 to-japanese-shiraumenezu/20 text-japanese-sumiiro hover:from-japanese-soshoku hover:to-japanese-shiraumenezu hover:text-japanese-sumiiro/90 transition-all duration-200 dark:from-japanese-murasakisuishiyou/10 dark:to-japanese-ginnezu/10 dark:text-japanese-shironezu dark:hover:from-japanese-murasakisuishiyou/30 dark:hover:to-japanese-ginnezu/30 dark:hover:text-white"
            >
              #{tag}
            </Link>
          ))}
        </div>

        <hr className="border-0 h-px bg-gradient-to-r from-transparent via-japanese-shiraumenezu to-transparent dark:via-japanese-murasakisuishiyou/30 mb-3" />

        {/* Content */}
        <article className="prose dark:prose-invert dark:text-japanese-shironezu text-sm md:text-base leading-relaxed max-w-none selection:bg-japanese-unoharairo/30 dark:selection:bg-japanese-murasakisuishiyou/20 prose-a:text-japanese-sumiiro prose-a:decoration-japanese-soshoku/50 hover:prose-a:text-japanese-sumiiro/70 hover:prose-a:decoration-japanese-sumiiro prose-headings:text-japanese-sumiiro dark:prose-headings:text-japanese-murasakisuishiyou">
          <ReactMarkdown
            components={components}
            remarkPlugins={[remarkMath, remarkGfm]}
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
            <p className="text-japanese-soshoku dark:text-japanese-murasakisuishiyou">Next:</p>
            <Link
              href={`/posts/${next.slug}`}
              className="ml-2 text-japanese-sumiiro dark:text-japanese-shironezu hover:text-japanese-sumiiro/70 dark:hover:text-japanese-murasakisuishiyou transition-colors duration-200"
            >
              {next.title}
            </Link>
          </div>
        )}
        {prev && (
          <div className="flex group">
            <p className="text-japanese-soshoku dark:text-japanese-murasakisuishiyou">Previous:</p>
            <Link
              href={`/posts/${prev.slug}`}
              className="ml-2 text-japanese-sumiiro dark:text-japanese-shironezu hover:text-japanese-sumiiro/70 dark:hover:text-japanese-murasakisuishiyou transition-colors duration-200"
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