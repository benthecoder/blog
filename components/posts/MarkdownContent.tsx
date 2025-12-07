import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Image from "next/image";
import remarkGfm from "remark-gfm";

import "katex/dist/katex.min.css";

const customDracula = {
  ...dracula,
  'pre[class*="language-"]': {
    ...dracula['pre[class*="language-"]'],
    borderRadius: 0,
    border: "none",
    borderImage: "none",
    borderWidth: 0,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    padding: "1rem",
    overflowX: "auto",
    maxWidth: "100%",
  },
};

export default function MarkdownContent({ content }: { content: string }) {
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={customDracula}
          language={match[1]}
          customStyle={{
            border: "none",
            boxShadow: "none",
            outline: "none",
          }}
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
              width={0}
              height={0}
              sizes="100vw"
              unoptimized={true}
              style={{ width: "100%", height: "auto", maxWidth: "800px" }}
              className="mx-auto"
            />
            <p className="text-gray-400 text-xs mt-1">{image.properties.alt}</p>
          </div>
        );
      }

      return <p>{children}</p>;
    },
  };

  return (
    <ReactMarkdown
      components={components}
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeKatex, { strict: false }]]}
    >
      {content}
    </ReactMarkdown>
  );
}
