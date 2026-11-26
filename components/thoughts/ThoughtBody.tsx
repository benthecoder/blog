import type { ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  isBareUrlLabel,
  linkHost,
  parsePublicUrl,
  untitledLinkLabel,
} from "@/utils/tweets/link";
import { contentHasUrl } from "@/utils/thoughtMarkdown";

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function ThoughtLink({
  href,
  titles,
  children,
}: {
  href: string;
  titles: Record<string, string>;
  children?: ReactNode;
}) {
  const url = parsePublicUrl(href) ?? href;
  const text = textOf(children);
  const bare =
    !children || isBareUrlLabel(text, href) || isBareUrlLabel(text, url);
  if (!bare) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-accent/70 transition-colors wrap-break-word"
      >
        {children}
      </a>
    );
  }
  const title = titles[url] ?? titles[href];
  const host = linkHost(url);
  // The host sits beside the link, not inside it: a child's
  // `no-underline` cannot hide a parent's text-decoration.
  return (
    <span className="wrap-break-word">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-accent/70 transition-colors"
      >
        {title ?? untitledLinkLabel(url)}
      </a>
      {title && host ? (
        <span className="ml-1.5 text-xs text-muted">{host}</span>
      ) : null}
    </span>
  );
}

export default function ThoughtBody({
  content,
  link,
  titles,
}: {
  content: string;
  link: string | null;
  titles: Record<string, string>;
}) {
  const note = content.trim();
  const attached =
    link && parsePublicUrl(link) && !contentHasUrl(note, link) ? link : null;

  return (
    <div className="thought-md text-sm text-accent leading-relaxed wrap-break-word flex-1">
      {note ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          urlTransform={defaultUrlTransform}
          components={{
            a({ href, children }) {
              if (!href || href.startsWith("#")) {
                return <a href={href}>{children}</a>;
              }
              return (
                <ThoughtLink href={href} titles={titles}>
                  {children}
                </ThoughtLink>
              );
            },
          }}
        >
          {note}
        </ReactMarkdown>
      ) : null}
      {attached ? (
        <p className={note ? "mt-2" : undefined}>
          <ThoughtLink href={attached} titles={titles} />
        </p>
      ) : null}
    </div>
  );
}
