import type { PostMetadata } from "@/types/post";

export interface QuarterlyData {
  monthly: PostMetadata[];
  journal: PostMetadata[];
}

/**
 * Reflection draft: fixed prompts and the raw material, nothing generated.
 * The comment block is for you only; delete it before publishing.
 */
export function renderQuarterly(d: QuarterlyData): string {
  const line = (p: PostMetadata) =>
    `- ${p.date}: ${p.title} (/posts/${p.slug})`;
  return (
    [
      "what happened\n\n- ",
      "what i changed my mind about\n\n- ",
      "what i'm carrying into next quarter\n\n- ",
      "<!-- raw material. delete before publishing\n\nmonthly posts\n" +
        (d.monthly.map(line).join("\n") || "-") +
        "\n\njournal\n" +
        (d.journal.map(line).join("\n") || "-") +
        "\n-->",
    ].join("\n\n") + "\n"
  );
}
