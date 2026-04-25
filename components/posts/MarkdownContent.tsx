"use client";

import { useMemo } from "react";
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
import Image from "next/image";
import remarkGfm from "remark-gfm";
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

export default function MarkdownContent({ content }: { content: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const style = isDark ? customDracula : customOneLight;

  const components = useMemo<Components>(
    () => ({
      // In react-markdown v9, inline code has no language- class; block code does
      code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        const codeString = String(children).replace(/\n$/, "");
        return match ? (
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
        ) : (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
      p({ node, children }) {
        const first = node?.children[0] as
          | { tagName?: string; properties?: Record<string, unknown> }
          | undefined;
        if (first?.tagName === "img") {
          const src = first.properties?.src as string;
          const alt = (first.properties?.alt as string) ?? "";
          return (
            <div className="text-center">
              <Image
                src={src}
                alt={alt}
                width={800}
                height={600}
                sizes="(max-width: 800px) 100vw, 800px"
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                  maxHeight: "65vh",
                  display: "block",
                  margin: "0 auto",
                }}
                className=""
              />
              {alt && <p className="text-gray-400 text-xs mt-1">{alt}</p>}
            </div>
          );
        }
        return <p>{children}</p>;
      },
    }),
    [style]
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
