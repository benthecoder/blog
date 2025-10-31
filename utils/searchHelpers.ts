import React from "react";

export const extractKeywords = (query: string): string[] => {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);
};

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

  // Find first keyword match
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

  // No match - just truncate
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

export const highlightText = (
  text: string,
  keywords: string[]
): React.ReactNode => {
  if (keywords.length === 0) return text;

  const parts: React.ReactNode[] = [];
  const lowerText = text.toLowerCase();
  let lastIndex = 0;

  // Find all keyword positions
  const matches: Array<{ index: number; length: number }> = [];
  keywords.forEach((keyword) => {
    let index = lowerText.indexOf(keyword);
    while (index !== -1) {
      matches.push({ index, length: keyword.length });
      index = lowerText.indexOf(keyword, index + 1);
    }
  });

  // Sort and avoid overlaps
  matches.sort((a, b) => a.index - b.index);

  matches.forEach(({ index, length }, i) => {
    if (index >= lastIndex) {
      if (index > lastIndex) parts.push(text.substring(lastIndex, index));
      parts.push(
        React.createElement(
          "mark",
          {
            key: i,
            className:
              "bg-light-accent dark:bg-dark-accent text-white font-medium px-1 py-0.5 rounded",
          },
          text.substring(index, index + length)
        )
      );
      lastIndex = index + length;
    }
  });

  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return React.createElement(React.Fragment, null, ...parts);
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
