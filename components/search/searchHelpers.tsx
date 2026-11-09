import type { ReactNode } from "react";

export const getSnippet = (
  text: string,
  matcher: RegExp | null,
  maxLength = 200
): string => {
  // `search` ignores the global matcher's lastIndex, so highlighting stays intact.
  const index = matcher ? text.search(matcher) : -1;
  if (index === -1)
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + maxLength - 60);
  let snippet = text.substring(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";
  return snippet;
};

export const highlightText = (
  text: string,
  matcher: RegExp | null
): ReactNode => {
  if (!matcher) return text;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(matcher)) {
    if (match.index > lastIndex)
      parts.push(text.substring(lastIndex, match.index));
    parts.push(
      <mark
        key={match.index}
        className="bg-accent text-surface font-medium px-1 py-0.5 rounded-sm"
      >
        {match[0]}
      </mark>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return <>{parts}</>;
};

export const formatChunkTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    "full-post": "posts",
    section: "sections",
    code: "code",
    quote: "quotes",
  };
  return labels[type] || type;
};
