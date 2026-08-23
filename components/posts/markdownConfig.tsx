import type { Components } from "react-markdown";
import type { PluggableList } from "unified";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import PostImage from "./PostImage";
import remarkWikiLink from "./remarkWikiLink";
import type { ImageMeta } from "@/utils/content/imageMeta";
import "katex/dist/katex.min.css";

export const remarkPlugins: PluggableList = [
  remarkMath,
  remarkGfm,
  remarkWikiLink,
];
export const rehypePlugins: PluggableList = [
  rehypeRaw,
  rehypeSlug,
  [rehypeKatex, { strict: false }],
];

// `getImageMeta` is only available server-side (it reads the manifest from
// disk), so the server MarkdownContent passes it and the client admin
// preview renders without dimensions or blur.
export function createBaseComponents(
  getImageMeta?: (src: string) => ImageMeta | null
): Components {
  return {
    p({ node, children }) {
      const first = node?.children[0] as
        | { tagName?: string; properties?: Record<string, unknown> }
        | undefined;
      if (first?.tagName === "img") {
        const src = first.properties?.src as string;
        const alt = (first.properties?.alt as string) ?? "";
        const meta = getImageMeta?.(src) ?? null;
        return <PostImage src={src} alt={alt} meta={meta} />;
      }
      return <p>{children}</p>;
    },
  };
}

export const baseComponents: Components = createBaseComponents();
