import { cache } from "react";
import { WIKI_DIR } from "@/config/paths";
import { PAPER_TOPICS, PAPERS_CATEGORY } from "@/config/papers";
import { scanMarkdownDir } from "./markdown";
import { readPaperFields } from "./paperFields";
import { parseTags } from "./tags";

export interface PaperEntry {
  slug: string;
  title: string;
  description: string;
  topic: string;
  authors: string;
  year: string;
  url: string;
  /** YYYY-MM-DD, or "" when unknown. */
  read: string;
  tags: string[];
}

export interface PaperTopicGroup {
  slug: string;
  label: string;
  papers: PaperEntry[];
}

function topicOf(category: string): string | null {
  const [root, topic = ""] = category.trim().split("/");
  return root === PAPERS_CATEGORY ? topic.trim() : null;
}

function labelFor(slug: string): string {
  const known = PAPER_TOPICS.find((t) => t.slug === slug);
  if (known) return known.label;
  if (!slug) return "Other";
  return slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Every wiki page under `papers/`, newest `read` first (undated last). */
export const getPapers = cache(function getPapers(): PaperEntry[] {
  return scanMarkdownDir(WIKI_DIR)
    .flatMap(({ slug, data }) => {
      const topic = topicOf(
        typeof data.category === "string" ? data.category : ""
      );
      if (topic === null) return [];
      const fields = readPaperFields(data);
      return [
        {
          slug,
          title: (data.title as string) || slug,
          description:
            typeof data.description === "string" ? data.description : "",
          topic,
          authors: fields.authors,
          year: fields.year,
          url: fields.url,
          read: fields.read,
          tags: parseTags(data.tags),
        },
      ];
    })
    .sort(
      (a, b) =>
        (b.read || "").localeCompare(a.read || "") ||
        a.title.localeCompare(b.title)
    );
});

/** Papers grouped by topic in PAPER_TOPICS order; empty topics are omitted. */
export function groupPapersByTopic(papers: PaperEntry[]): PaperTopicGroup[] {
  const order = new Map<string, number>(
    PAPER_TOPICS.map((t, i) => [t.slug, i])
  );
  const groups = new Map<string, PaperTopicGroup>();
  for (const paper of papers) {
    const group = groups.get(paper.topic) ?? {
      slug: paper.topic,
      label: labelFor(paper.topic),
      papers: [],
    };
    group.papers.push(paper);
    groups.set(paper.topic, group);
  }
  return [...groups.values()].sort(
    (a, b) =>
      (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99) ||
      a.label.localeCompare(b.label)
  );
}
