import type { ReactNode } from "react";

export const extractKeywords = (query: string): string[] =>
  query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);

export const getSnippet = (
  text: string,
  keywords: string[],
  maxLength = 200
): string => {
  if (keywords.length === 0) {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  const lowerText = text.toLowerCase();
  for (const keyword of keywords) {
    const index = lowerText.indexOf(keyword);
    if (index !== -1) {
      const start = Math.max(0, index - 60);
      const end = Math.min(text.length, index + maxLength - 60);
      let snippet = text.substring(start, end);
      if (start > 0) snippet = "..." + snippet;
      if (end < text.length) snippet = snippet + "...";
      return snippet;
    }
  }

  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

export const highlightText = (text: string, keywords: string[]): ReactNode => {
  if (keywords.length === 0) return text;

  const lowerText = text.toLowerCase();
  const matches: Array<{ index: number; length: number }> = [];

  keywords.forEach((keyword) => {
    let index = lowerText.indexOf(keyword);
    while (index !== -1) {
      matches.push({ index, length: keyword.length });
      index = lowerText.indexOf(keyword, index + 1);
    }
  });

  matches.sort((a, b) => a.index - b.index);

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach(({ index, length }, i) => {
    if (index >= lastIndex) {
      if (index > lastIndex) parts.push(text.substring(lastIndex, index));
      parts.push(
        <mark
          key={i}
          className="bg-japanese-sumiiro dark:bg-japanese-shironezu text-japanese-gofuniro dark:text-japanese-sumiiro font-medium px-1 py-0.5 rounded"
        >
          {text.substring(index, index + length)}
        </mark>
      );
      lastIndex = index + length;
    }
  });

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
