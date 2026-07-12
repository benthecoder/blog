import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { codeToHtml } from "shiki";
import { isSafeSlug } from "@/config/paths";
import { getPostPreviewData } from "@/utils/content/preview";
import CopyButton from "./CopyButton";
import PostLinkPreview from "./PostLinkPreview";
import { baseComponents, remarkPlugins, rehypePlugins } from "./markdownConfig";

// Internal post links get a hover preview card. Matches relative and absolute
// forms; anything else falls through to a plain anchor.
function postSlugFromHref(href: string): string | null {
  const match = href.match(/^(?:https?:\/\/bneo\.xyz)?\/posts\/([^/#?]+)$/);
  if (!match) return null;
  const slug = decodeURIComponent(match[1]);
  return isSafeSlug(slug) ? slug : null;
}

// Server component: fenced code is highlighted with shiki at render time
// (build time for static pages), so no highlighting JS ships to the client.
// Both themes are emitted as CSS variables; globals.css flips them on .dark.
async function CodeBlock({
  language,
  code,
}: {
  language: string;
  code: string;
}) {
  let html: string;
  try {
    html = await codeToHtml(code, {
      lang: language,
      themes: { light: "one-light", dark: "dracula" },
    });
  } catch {
    return (
      <pre className="shiki">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div className="relative group/code">
      <CopyButton code={code} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

const components: Components = {
  ...baseComponents,
  a({ href, children }) {
    const slug = href ? postSlugFromHref(href) : null;
    const preview = slug ? getPostPreviewData(slug) : null;
    if (preview) {
      return (
        <PostLinkPreview slug={preview.slug} preview={preview}>
          {children}
        </PostLinkPreview>
      );
    }
    return <a href={href}>{children}</a>;
  },
  pre({ node, children }) {
    const codeNode = node?.children[0] as
      | {
          tagName?: string;
          properties?: { className?: string[] };
          children?: { type?: string; value?: string }[];
        }
      | undefined;

    if (codeNode?.tagName === "code") {
      const className = codeNode.properties?.className?.join(" ") ?? "";
      const match = /language-(\w+)/.exec(className);
      const text = codeNode.children?.[0];
      if (match && text?.type === "text" && typeof text.value === "string") {
        return (
          <CodeBlock language={match[1]} code={text.value.replace(/\n$/, "")} />
        );
      }
    }
    return <pre>{children}</pre>;
  },
};

export default function MarkdownContent({ content }: { content: string }) {
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
