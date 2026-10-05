"use client";

import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import { useMemo } from "react";
import Link from "next/link";
import { createResolver } from "@/utils/links/resolve";
import type { LinkableEntry } from "@/types/links";
import { decodeWikiLinkHref, WIKILINK_SCHEME } from "./remarkWikiLink";
import { baseComponents, remarkPlugins, rehypePlugins } from "./markdownConfig";

// Client-side renderer for the admin editor's live preview.
// Code blocks are unhighlighted; published pages use the server
// MarkdownContent with shiki instead.
const EMPTY_ENTRIES: LinkableEntry[] = [];

export default function MarkdownPreview({
  content,
  linkEntries = EMPTY_ENTRIES,
}: {
  content: string;
  linkEntries?: LinkableEntry[];
}) {
  const resolve = useMemo(() => createResolver(linkEntries), [linkEntries]);
  const components = useMemo(
    () => ({
      ...baseComponents,
      a: ({
        href,
        children,
      }: {
        href?: string;
        children?: React.ReactNode;
      }) => {
        const target = href ? decodeWikiLinkHref(href) : null;
        if (target !== null) {
          const entry = resolve(target);
          return entry ? (
            <Link href={entry.href}>{children}</Link>
          ) : (
            <>{children}</>
          );
        }
        return <a href={href}>{children}</a>;
      },
    }),
    [resolve]
  );
  return (
    <ReactMarkdown
      components={components}
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      urlTransform={(url) =>
        url.startsWith(WIKILINK_SCHEME) ? url : defaultUrlTransform(url)
      }
    >
      {content}
    </ReactMarkdown>
  );
}
