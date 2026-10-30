import type { Components } from "react-markdown";
import type { PluggableList } from "unified";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import PostImage from "./PostImage";
import remarkWikiLink from "./remarkWikiLink";
import rehypeSidenotes from "./rehypeSidenotes";
import type { ImageMeta } from "@/utils/content/imageMeta";
import remarkImageParagraphs from "@/utils/content/remarkImageParagraphs";
import "katex/dist/katex.min.css";

// Minimal mdast shape — @types/mdast is not a dependency of this repo.
interface MdastNode {
  type: string;
  children?: MdastNode[];
  data?: { hProperties?: Record<string, string> };
}

function flagFirstImage(node: MdastNode): boolean {
  if (node.type === "image") {
    node.data = {
      ...node.data,
      hProperties: { ...node.data?.hProperties, "data-priority": "true" },
    };
    return true;
  }
  for (const child of node.children ?? []) {
    if (flagFirstImage(child)) return true;
  }
  return false;
}

// Flags the first image in the document so its plate can preload: on a
// photo-led post that image is the LCP element, and lazy-loading it delays
// the one paint the reader is waiting for.
export function remarkFirstImage() {
  return (tree: MdastNode) => {
    flagFirstImage(tree);
  };
}

export const remarkPlugins: PluggableList = [
  remarkMath,
  remarkGfm,
  remarkWikiLink,
  remarkImageParagraphs,
  remarkFirstImage,
];
export const createRehypePlugins = (headingPrefix = ""): PluggableList => [
  rehypeRaw,
  [rehypeSlug, { prefix: headingPrefix }],
  [rehypeKatex, { strict: false }],
  // Runs last: sidenotes need the footnote section fully rendered.
  rehypeSidenotes,
];

export const rehypePlugins = createRehypePlugins();

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
        // rehype-raw re-parses the tree, which camel-cases data-* attributes.
        const priority = first.properties?.dataPriority === "true";
        return (
          <PostImage src={src} alt={alt} meta={meta} priority={priority} />
        );
      }
      return <p>{children}</p>;
    },
  };
}

export const baseComponents: Components = createBaseComponents();
