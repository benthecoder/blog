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

  // Text fragments only apply on full document loads, so use a plain anchor.
  const fragment = query
    ? textFragment(result.content, keywords, result.chunk_type)
    : null;
  const href = `/posts/${result.post_slug}`;
  const className =
    "group block mb-4 p-4 border border-rule/40 dark:border-night-raised/40 bg-paper-raised/40 dark:bg-night-raised/20 hover:border-ink/60 dark:hover:border-chalk-soft/60 hover:bg-paper-tint/60 dark:hover:bg-night-raised/40 transition-[border-color,background-color,box-shadow] duration-200 hover:shadow-xs";

  const body = (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium text-primary group-hover:text-ink dark:group-hover:text-chalk-soft transition-colors">
            {result.post_title}
          </h3>
          {result.score_type !== "keyword" && (
            <span className="text-xs px-2 py-1 rounded-full bg-ink/10 dark:bg-chalk-soft/10 text-ink dark:text-chalk-soft font-medium whitespace-nowrap">
              {Math.round(result.similarity * 100)}%
            </span>
          )}
        </div>

        {result.chunk_type === "code" ? (
          <pre className="mt-2 bg-paper-warm/40 dark:bg-night-raised p-3 rounded-xs text-sm overflow-x-auto">
            <code>{snippet}</code>
          </pre>
        ) : (
          <p className="text-primary/70 mt-2 text-sm leading-relaxed">
            {highlightText(snippet, keywords)}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-ink-muted dark:text-chalk-muted pt-1">
          <span className="capitalize font-medium">{result.chunk_type}</span>
          {result.section && (
            <>
              <span>•</span>
              <span className="text-ink-muted dark:text-chalk-muted italic">
                {result.section}
              </span>
            </>
          )}
          {result.language && (
            <>
              <span>•</span>
              <span className="text-ink-muted dark:text-chalk-muted font-mono text-[10px]">
                {result.language}
              </span>
            </>
          )}
          {result.tags && result.tags.length > 3 && (
            <>
              <span>•</span>
              <span className="text-ink-muted dark:text-chalk-muted">
                +{result.tags.length - 3} tags
              </span>
            </>
          )}
        </div>
      </div>
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
