import { DRAFTS_DIR, POSTS_DIR } from "@/config/paths";
import { scanMarkdownDir } from "@/utils/content/markdown";
import { SOURCES } from "./sources";
import { mergeLinks } from "./merge";
import type { LinkItem } from "./types";

export async function collectLinks(
  since: Date,
  until: Date,
  names: string[] = Object.keys(SOURCES)
): Promise<LinkItem[]> {
  const batches = await Promise.all(
    names.map(async (name) => {
      const source = SOURCES[name];
      if (!source) throw new Error(`unknown source: ${name}`);
      const items = await source.fetch(since, until);
      console.log(`${name}: ${items.length}`);
      return { source: name, items };
    })
  );
  return mergeLinks(batches);
}

export function nextIssueNumber(): number {
  const titles = [POSTS_DIR, DRAFTS_DIR]
    .flatMap((d) => scanMarkdownDir(d))
    .map((f) => String(f.data.title ?? "").match(/^sunday links #(\d+)/i));
  return Math.max(0, ...titles.map((m) => (m ? Number(m[1]) : 0))) + 1;
}
