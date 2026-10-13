import { cache } from "react";
import { PAPERS_MD, WIKI_DIR } from "@/config/paths";
import { readMarkdownFile, scanMarkdownDir } from "./markdown";

/** Wiki category prefix that marks a page as a paper note. */
const PAPERS_CATEGORY = "papers";

export interface PaperListItem {
  title: string;
  url: string;
  authors: string;
  year: string;
  /** "YYYY-MM" or "YYYY-MM-DD" for read papers, "" for the queue. */
  read: string;
  /** `/wiki/<slug>` when a paper note exists. */
  note: string;
}

export interface PaperList {
  upNext: PaperListItem[];
  /** Read papers grouped by month read, newest first; undated last. */
  read: { month: string; papers: PaperListItem[] }[];
}

// - [Title](url) — Authors, 2017 · read 2026-10
const LINE =
  /^\s*[-*]\s+\[(?<title>[^\]]+)\]\((?<url>[^)\s]+)\)\s*(?:[—–-]+\s*(?<rest>.*))?$/;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function parsePaperLine(
  line: string
): Omit<PaperListItem, "note"> | null {
  const m = LINE.exec(line);
  if (!m?.groups) return null;
  let rest = (m.groups.rest ?? "").trim();
  let read = "";
  const readMatch = /\s*·\s*read\s+(\d{4}-\d{2}(?:-\d{2})?)\s*$/i.exec(rest);
  if (readMatch) {
    read = readMatch[1];
    rest = rest.slice(0, readMatch.index).trim();
  }
  let year = "";
  const yearMatch = /,?\s*\(?((?:19|20)\d{2})\)?\s*$/.exec(rest);
  if (yearMatch) {
    year = yearMatch[1];
    rest = rest.slice(0, yearMatch.index).trim();
  }
  return {
    title: m.groups.title.trim(),
    url: m.groups.url,
    authors: rest.replace(/[,·]\s*$/, "").trim(),
    year,
    read,
  };
}

/** Parse the list: `## up next` and `## read` sections of `- [Title](url) — …` lines. */
export function parsePaperList(
  markdown: string,
  notes: { slug: string; title: string }[] = []
): PaperList {
  const byKey = new Map<string, string>();
  for (const note of notes) {
    for (const key of [normalize(note.title), normalize(note.slug)])
      if (key && !byKey.has(key)) byKey.set(key, `/wiki/${note.slug}`);
  }
  const noteFor = (title: string) => {
    const full = normalize(title);
    // "BERT: Pre-training of …" also matches a note titled "BERT".
    const short = normalize(title.split(":")[0]);
    return byKey.get(full) ?? byKey.get(short) ?? "";
  };

  const text = markdown.replace(/<!--[\s\S]*?-->/g, "");
  const upNext: PaperListItem[] = [];
  const read: PaperListItem[] = [];
  let section: "up next" | "read" | null = null;
  for (const line of text.split("\n")) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      const name = heading[1].toLowerCase();
      section = name.startsWith("read")
        ? "read"
        : /up next|reading|tracking|to read/.test(name)
          ? "up next"
          : null;
      continue;
    }
    if (!section) continue;
    const item = parsePaperLine(line);
    if (!item) continue;
    (section === "read" ? read : upNext).push({
      ...item,
      note: noteFor(item.title),
    });
  }

  const months = new Map<string, PaperListItem[]>();
  for (const item of read) {
    const month = item.read.slice(0, 7);
    months.set(month, [...(months.get(month) ?? []), item]);
  }
  return {
    upNext,
    read: [...months.entries()]
      .sort(([a], [b]) => (b || "0").localeCompare(a || "0"))
      .map(([month, papers]) => ({
        month,
        papers: papers.sort((a, b) => b.read.localeCompare(a.read)),
      })),
  };
}

/** Wiki pages filed under `papers/…`; these are the notes list items link to. */
const getPaperNotes = cache(function getPaperNotes() {
  return scanMarkdownDir(WIKI_DIR).flatMap(({ slug, data }) => {
    const category = typeof data.category === "string" ? data.category : "";
    if (category.trim().split("/")[0] !== PAPERS_CATEGORY) return [];
    return [{ slug, title: (data.title as string) || slug }];
  });
});

export const getPaperList = cache(function getPaperList(): PaperList {
  return parsePaperList(readMarkdownFile(PAPERS_MD).content, getPaperNotes());
});
