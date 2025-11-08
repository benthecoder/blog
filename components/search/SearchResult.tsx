import Link from "next/link";
import {
  extractKeywords,
  getSnippet,
  highlightText,
} from "@/utils/searchHelpers";

interface SearchResultProps {
  result: {
    content: string;
    post_slug: string;
    post_title: string;
    chunk_type: string;
    tags: string[];
    published_date?: string;
    similarity: number;
    vector_similarity?: number;
    keyword_score?: number;
    score_type: "keyword" | "semantic" | "hybrid";
    section?: string;
    language?: string;
  };
  query?: string;
}

export default function SearchResult({ result, query }: SearchResultProps) {
  const keywords = query ? extractKeywords(query) : [];
  const snippet = query
    ? getSnippet(result.content, keywords)
    : result.content.length > 200
      ? result.content.substring(0, 200) + "..."
      : result.content;

  return (
    <Link
      href={`/posts/${result.post_slug}`}
      className="group block mb-4 p-4 border border-light-border/40 dark:border-dark-tag/40 bg-japanese-hakuji/40 dark:bg-dark-tag/20 hover:border-light-accent/60 dark:hover:border-dark-accent/60 hover:bg-japanese-unoharairo/60 dark:hover:bg-dark-tag/40 transition-all duration-200 hover:shadow-sm"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium text-light-text dark:text-dark-text group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors">
            {result.post_title}
          </h3>
          {result.score_type !== "keyword" && (
            <span className="text-xs px-2 py-1 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent font-medium whitespace-nowrap">
              {Math.round(result.similarity * 100)}%
            </span>
          )}
        </div>

        {result.chunk_type === "code" ? (
          <pre className="mt-2 bg-japanese-soshoku/40 dark:bg-japanese-sumiiro/20 p-3 rounded-sm text-sm overflow-x-auto">
            <code>{snippet}</code>
          </pre>
        ) : (
          <p className="text-light-text/70 dark:text-dark-text/70 mt-2 text-sm leading-relaxed">
            {highlightText(snippet, keywords)}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-light-accent/70 dark:text-dark-accent/70 pt-1">
          <span className="capitalize font-medium">{result.chunk_type}</span>
          {result.section && (
            <>
              <span>•</span>
              <span className="text-light-text/60 dark:text-dark-text/60 italic">
                {result.section}
              </span>
            </>
          )}
          {result.language && (
            <>
              <span>•</span>
              <span className="text-light-text/60 dark:text-dark-text/60 font-mono text-[10px]">
                {result.language}
              </span>
            </>
          )}
          {result.tags && result.tags.length > 3 && (
            <>
              <span>•</span>
              <span className="text-light-text/50 dark:text-dark-text/50">
                +{result.tags.length - 3} tags
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
