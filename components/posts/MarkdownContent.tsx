"use client";

import { useMemo } from "react";
import type React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import type { PluggableList } from "unified";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  dracula,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import PostImage from "./PostImage";
import { useTheme } from "next-themes";
import CopyButton from "./CopyButton";
import "katex/dist/katex.min.css";

const baseOverrides = {
  borderRadius: 0,
  border: "none",
  borderImage: "none",
  borderWidth: 0,
  margin: 0,
  padding: "1rem",
  overflowX: "auto" as const,
  maxWidth: "100%",
  boxShadow: "none",
  outline: "none",
};

const customDracula = {
  ...dracula,
  'pre[class*="language-"]': {
    ...dracula['pre[class*="language-"]'],
    ...baseOverrides,
  },
};

const customOneLight = {
  ...oneLight,
  'pre[class*="language-"]': {
    ...oneLight['pre[class*="language-"]'],
    ...baseOverrides,
    background: "#f3f3f2",
  },
  'code[class*="language-"]': {
    ...oneLight['code[class*="language-"]'],
    background: "transparent",
  },
};

const remarkPlugins: PluggableList = [remarkMath, remarkGfm];
const rehypePlugins: PluggableList = [
  rehypeRaw,
  [rehypeKatex, { strict: false }],
];

function CodeBlock({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const style = resolvedTheme === "dark" ? customDracula : customOneLight;
  const match = /language-(\w+)/.exec(className || "");
  const codeString = String(children).replace(/\n$/, "");

  if (!match) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group/code">
      <CopyButton code={codeString} />
      <SyntaxHighlighter
        style={style}
        language={match[1]}
        customStyle={{}}
        PreTag="div"
        {...(props as object)}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

export default function MarkdownContent({ content }: { content: string }) {
  const components = useMemo<Components>(
    () => ({
      code({ className, children, ...props }) {
        return (
          <CodeBlock className={className} {...props}>
            {children}
          </CodeBlock>
        );
      },
      p({ node, children }) {
        const first = node?.children[0] as
          | { tagName?: string; properties?: Record<string, unknown> }
          | undefined;
        if (first?.tagName === "img") {
          const src = first.properties?.src as string;
          const alt = (first.properties?.alt as string) ?? "";
          return <PostImage src={src} alt={alt} />;
        }
        return <p>{children}</p>;
      },
    }),
    []
  );

  return (
    <ReactMarkdown
      components={components}
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
    >
      {content}
    </ReactMarkdown>
  );
}
