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
  // Annotated links form the article; bare saves remain optional footer material.
  const main = items.filter((i) => i.highlights.length || i.take);
  const also = items.filter((i) => !i.highlights.length && !i.take);

  const blocks = main.map((i) => {
    const lines = [`- [${i.title}](${i.url})`];
    if (i.highlights.length)
      lines.push(i.highlights.map(quote).join("\n  >\n"));
    if (i.take?.trim()) lines.push(`  ${i.take.trim().replace(/\n/g, "\n  ")}`);
    return lines.join("\n");
  });

  const parts = [
    "<!-- a short personal update, with a photo if you want. -->",
    "## sunday links",
    blocks.join("\n\n"),
  ];
  if (also.length) {
    parts.push(
      "---\n\nlinks:\n" + also.map((i) => `- [${i.title}](${i.url})`).join("\n")
    );
  }
  return parts.filter(Boolean).join("\n\n") + "\n";
}
