import Link from "next/link";
import { extractKeywords, getSnippet, highlightText } from "./searchHelpers";
import { textFragment } from "@/utils/searchTextFragment";
import type { SearchResultItem } from "@/types/search";

interface SearchResultProps {
  result: SearchResultItem;
  query?: string;
}

export default function SearchResult({ result, query }: SearchResultProps) {
  const keywords = query ? extractKeywords(query) : [];
  const snippet = query
    ? getSnippet(result.content, keywords)
    : result.content.length > 200
      ? result.content.substring(0, 200) + "..."
      : result.content;
  // Text fragments need a full document load to reach the matching passage.
  const fragment = query
    ? textFragment(result.content, keywords, result.chunk_type)
    : null;
  const href = `/posts/${result.post_slug}`;
  const className =
    "group block border-b border-line py-5 last:border-0 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4";
  const meta = [
    result.published_date &&
      new Date(result.published_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }),
    result.chunk_type === "full-post" ? "post" : result.chunk_type,
    result.section,
    result.language,
  ]
    .filter(Boolean)
    .join(" · ");
  const body = (
    <>
      <h2 className="text-base text-accent group-hover:underline underline-offset-4 break-words">
        {result.post_title}
      </h2>
      <p className="mt-1 text-xs text-muted break-words">{meta}</p>
      {result.chunk_type === "code" ? (
        <pre className="mt-3 overflow-x-auto border-l border-line pl-3 text-xs leading-relaxed text-primary">
          <code>{snippet}</code>
        </pre>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-primary break-words">
          {highlightText(snippet, keywords)}
        </p>
      )}
    </>
  );
  return fragment ? (
    <a href={`${href}${fragment}`} className={className}>
      {body}
    </a>
  ) : (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
