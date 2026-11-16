import GithubSlugger from "github-slugger";

/** `cite` is who said it or the verse reference; `work` is the book, film,
    or letter it comes from, written after the first comma. */
type Saying = { text: string; cite: string; work?: string };
export type Topic = { id: string; title: string; sayings: Saying[] };

const CITE = /^(?:—|--)\s*(.+)$/;

/** Parses a sayings file: `## topic` headings, then entries separated by a
    blank line, each ending in a `— cite` line (an author or a reference).
    Throws on anything else, so a malformed entry fails the build instead of
    rendering wrong. */
export function parseSayings(markdown: string): Topic[] {
  const slugger = new GithubSlugger();
  const topics: Topic[] = [];
  for (const block of markdown.trim().split(/\n\s*\n/)) {
    const lines = block.split("\n").map((line) => line.trim());
    if (lines[0].startsWith("## ")) {
      const title = lines[0].slice(3).trim();
      topics.push({ id: slugger.slug(title), title, sayings: [] });
      lines.shift();
      if (lines.length === 0) continue;
    }
    const topic = topics.at(-1);
    if (!topic) throw new Error(`entry before any "## topic": ${lines[0]}`);
    const cite = CITE.exec(lines.at(-1) ?? "")?.[1];
    const text = lines.slice(0, -1).join(" ").trim();
    if (!cite || !text)
      throw new Error(`entry needs text and a "— cite" line: ${lines[0]}`);
    const [who, ...rest] = cite.split(", ");
    const work = rest.join(", ");
    topic.sayings.push(work ? { text, cite: who, work } : { text, cite: who });
  }
  const empty = topics.find((topic) => topic.sayings.length === 0);
  if (empty) throw new Error(`topic "${empty.title}" has no entries`);
  return topics;
}
