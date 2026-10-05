import type { LinkItem } from "./types";

function quote(text: string): string {
  return text
    .split("\n")
    .map((l) => `  > ${l}`.trimEnd())
    .join("\n");
}

/**
 * Body of a "sunday links" draft. Collects only: takes come from the sources
 * or are left as empty slots for you to fill in.
 */
export function renderWeekly(items: LinkItem[]): string {
  // Links with a highlight or a take get a slot; bare saves go under "also".
  const main = items.filter((i) => i.highlights.length || i.take);
  const also = items.filter((i) => !i.highlights.length && !i.take);

  const blocks = main.map((i) => {
    const lines = [`- [${i.title}](${i.url})`];
    if (i.highlights.length)
      lines.push(i.highlights.map(quote).join("\n  >\n"));
    lines.push(`  - take: ${i.take ?? ""}`.trimEnd());
    return lines.join("\n");
  });

  const parts = [
    "<!-- open with a photo + caption or a verse. delete this line -->",
    blocks.join("\n\n"),
  ];
  if (also.length) {
    parts.push(
      "also\n\n" + also.map((i) => `- [${i.title}](${i.url})`).join("\n")
    );
  }
  parts.push("read\n\n- \n\nwatch\n\n- ");
  return parts.filter(Boolean).join("\n\n") + "\n";
}
