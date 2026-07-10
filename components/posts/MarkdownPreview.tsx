"use client";

import ReactMarkdown from "react-markdown";
import { baseComponents, remarkPlugins, rehypePlugins } from "./markdownConfig";

// Client-side renderer for the admin editor's live preview.
// Code blocks are unhighlighted; published pages use the server
// MarkdownContent with shiki instead.
export default function MarkdownPreview({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={baseComponents}
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
    >
      {content}
    </ReactMarkdown>
  );
}
