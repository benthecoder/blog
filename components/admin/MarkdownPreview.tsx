import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import Image from "next/image";

import "katex/dist/katex.min.css";

const customDracula = {
  ...dracula,
  'pre[class*="language-"]': {
    ...dracula['pre[class*="language-"]'],
    borderRadius: 0,
    border: "none",
    padding: "1rem",
  },
};

export default function MarkdownPreview({ markdown }: { markdown: string }) {
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={customDracula}
          language={match[1]}
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
    img({ src, alt }: any) {
      return (
        <Image
          src={src || ""}
          alt={alt || ""}
          width={800}
          height={600}
          className="my-4"
        />
      );
    },
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={components}
    >
      {markdown}
    </ReactMarkdown>
  );
}
