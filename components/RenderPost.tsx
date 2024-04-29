import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Image from "next/image";
import "katex/dist/katex.min.css";

const RenderPost = ({ post, prev, next, slug }: any) => {
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={dracula}
          language={match[1]}
          customStyle={{ border: "none" }}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    p: ({ node, children }: any) => {
      if (node.children[0].tagName === "img") {
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
        className="border-black border-double border-4 p-3 bg-white dark:bg-gray-800 dark:border-white dark:text-gray-100"
      >
        {slug ? (
          <Link href={`/posts/${slug}`} className="mr-0">
            <h2 className="font-bold text-2xl mb-8 text-center">
              {post.data.title}
            </h2>
          </Link>
        ) : (
          <h2 className="font-bold text-lg md:text-2xl mb-8 text-center">
            {post.data.title}
          </h2>
        )}
        <article className="prose dark:text-white text-sm  md:text-base">
          <ReactMarkdown
            components={components}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
          >
            {post.content}
          </ReactMarkdown>
        </article>
        <div className="flex justify-between items-center mt-12">
          <div className="flex flex-wrap">
            {post.data.tags.split(", ").map((tag: any) => (
              <Link
                href={`/tags/${tag}`}
                key={tag}
                className="mr-2 px-1 py-0.5 border-2 bg-gray-200 text-sm md:text-base border-black border-double hover:bg-black hover:text-white hover:border-white hover:border-2 dark:bg-gray-800 dark:text-white dark:hover:text-black dark:hover:bg-white dark:border-white"
              >
                #{tag}
              </Link>
            ))}
          </div>
          <p className="text-gray-400 text-sm  md:text-base">
            {new Date(post.data.date).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="mt-10 flex flex-col text-sm  md:text-base">
        {next && (
          <div className="flex items-center">
            <p className="text-gray-400">Next:</p>
            <Link href={`/posts/${next.slug}`} className="ml-2 underline">
              {next.title}
            </Link>
          </div>
        )}
        {prev && (
          <div className="flex items-center">
            <p className="text-gray-400">Previous:</p>
            <Link href={`/posts/${prev.slug}`} className="ml-2 underline">
              {prev.title}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RenderPost;
