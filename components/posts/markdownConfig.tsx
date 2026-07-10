import type { Components } from "react-markdown";
import type { PluggableList } from "unified";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import PostImage from "./PostImage";
import "katex/dist/katex.min.css";

export const remarkPlugins: PluggableList = [remarkMath, remarkGfm];
export const rehypePlugins: PluggableList = [
  rehypeRaw,
  [rehypeKatex, { strict: false }],
];

export const baseComponents: Components = {
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
};
