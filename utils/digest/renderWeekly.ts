import { highlightExcerpt } from "./highlightExcerpt";
import type { LinkItem } from "./types";

function quote(text: string): string {
  return text
    .split("\n")
    .map((l) => `  > ${l}`.trimEnd())
    .join("\n");
}

/**
 * Body of a "sunday links" draft. Collects only: takes come from the sources
 * when present. Personal updates and reactions are always the author’s.
 */
export function renderWeekly(items: LinkItem[]): string {
  const blocks = items.map((i) => {
    const lines = [`- [${i.title}](${i.url})`];
    if (i.highlights.length)
      lines.push(
        i.highlights
          .map(highlightExcerpt)
          .filter(Boolean)
          .map(quote)
          .join("\n  >\n")
      );
    if (i.take?.trim()) lines.push(`  ${i.take.trim().replace(/\n/g, "\n  ")}`);
    return lines.join("\n");
  });

  const parts = [
    "<!-- optional: a short update or a one-line overview of these links. -->",
    blocks.join("\n\n"),
  ];
  return parts.filter(Boolean).join("\n\n") + "\n";
}
