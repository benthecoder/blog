import type { PostMetadata } from "@/types/post";
import type { LinkItem } from "./types";

export interface MonthlyData {
  links: LinkItem[];
  watching: string[];
  journal: PostMetadata[];
  thoughts: { at: Date; text: string }[];
}

const short = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function reading(i: LinkItem): string {
  const lines = [`- [${i.title}](${i.url})`];
  for (const h of i.highlights) lines.push(`  > ${h.replace(/\n/g, "\n  > ")}`);
  if (i.take) lines.push(`  - ${i.take}`);
  return lines.join("\n");
}

/**
 * "highlights" draft. Reading and watching are rolled up from what you already
 * wrote; plot is a list of candidate events for you to rewrite.
 */
export function renderMonthly(d: MonthlyData): string {
  const read = d.links.filter((i) => i.highlights.length || i.take);
  const plot = d.journal.map((p) => `- ${short(p.date)}: ${p.title}`);
  const raw = d.thoughts.map(
    (t) => `- ${short(t.at)}: ${t.text.replace(/\s+/g, " ").slice(0, 120)}`
  );

  return (
    [
      "things i enjoyed reading\n\n" + (read.map(reading).join("\n\n") || "- "),
      "things i enjoyed watching\n\n" + (d.watching.join("\n") || "- "),
      "plot\n\n<!-- candidate events from your journal posts. rewrite as prose, delete this -->\n\n" +
        (plot.join("\n") || "- "),
      raw.length
        ? "<!-- thoughts this month, raw material. delete before publishing\n" +
          raw.join("\n") +
          "\n-->"
        : "",
    ]
      .filter(Boolean)
      .join("\n\n") + "\n"
  );
}
