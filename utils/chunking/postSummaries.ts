import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { generateStructured, RateLimitError } from "../llm";
import { stripScaffolding } from "./postVectors";

export interface SummaryInput {
  slug: string;
  title: string;
  tags: string;
  text: string;
}

export interface SummaryCacheEntry {
  hash: string;
  summary: string;
}
export type SummaryCache = Record<string, SummaryCacheEntry>;

const MIN_SUMMARY = 25;
const MAX_SUMMARY = 420;

export function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

/**
 * Reduce a markdown post to the prose an LLM should summarize: no
 * frontmatter, images, template lines, or bare link lists.
 */
export function cleanPostText(markdown: string, maxChars: number): string {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, "");
  const lines = stripScaffolding(body)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .split("\n")
    .map((l) => l.replace(/^[>\s#*-]+/, "").trim())
    .filter((l) => l.length > 0);
  return lines.join(" ").replace(/\s+/g, " ").slice(0, maxChars);
}

export function readFrontmatter(markdown: string): {
  title: string;
  tags: string;
} {
  const fm = markdown.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const pick = (key: string) =>
    fm
      .match(new RegExp(`^${key}:\\s*['"]?(.*?)['"]?\\s*$`, "m"))?.[1]
      ?.trim() ?? "";
  return { title: pick("title"), tags: pick("tags") };
}

export function buildSummaryPrompt(items: SummaryInput[]): string {
  const posts = items
    .map(
      (p) =>
        `### ${p.slug}\ntitle: ${p.title}${p.tags ? `\ntags: ${p.tags}` : ""}\n${p.text}`
    )
    .join("\n\n");
  return `Summarize what each blog post below is ABOUT: the ideas, arguments, questions, or subject it explores.
Write 1-2 plain sentences per post (under 50 words). Ignore logistics such as meals, sleep, mood, schedules, and boilerplate link lists; for a link roundup, name the topics the links cover. If a post is mostly a personal diary, say what it reflects on, not what happened hour by hour.

Return one entry per post, using the id shown after ###. Include every id exactly once.

${posts}`;
}

export const summarySchema = z.object({
  summaries: z.array(z.object({ id: z.string(), summary: z.string() })),
});

/** Keep only well-formed summaries for the requested slugs. */
export function validSummaries(
  reply: z.infer<typeof summarySchema>,
  slugs: string[]
): Map<string, string> {
  const wanted = new Set(slugs);
  const out = new Map<string, string>();
  for (const { id, summary: raw } of reply.summaries) {
    if (!wanted.has(id) || out.has(id)) continue;
    const summary = raw.replace(/\s+/g, " ").trim();
    if (summary.length >= MIN_SUMMARY && summary.length <= MAX_SUMMARY) {
      out.set(id, summary);
    }
  }
  return out;
}

export function loadCache<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function saveCache(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
}

/** Posts that still need a summary: no cache entry, or content changed. */
export function pendingSummaries(
  items: (SummaryInput & { hash: string })[],
  cache: SummaryCache
) {
  return items.filter((i) => cache[i.slug]?.hash !== i.hash);
}

export interface SummarizeOptions {
  batchSize: number;
  maxRequests: number;
  // pause between requests to stay under per-minute limits
  delayMs?: number;
}

export interface SummarizeResult {
  requests: number;
  stoppedBy: "done" | "rate-limit" | "budget";
}

/**
 * Summarize pending posts in batches, saving the cache after every request.
 * Failed slugs are retried in later batches (twice at most). Stops cleanly on
 * a rate limit or when the request budget is spent; rerun to resume.
 */
export async function summarizePending(
  pending: (SummaryInput & { hash: string })[],
  cache: SummaryCache,
  save: (cache: SummaryCache) => void,
  options: SummarizeOptions
): Promise<SummarizeResult> {
  const queue = [...pending];
  const attempts = new Map<string, number>();
  let requests = 0;

  while (queue.length > 0) {
    if (requests >= options.maxRequests)
      return { requests, stoppedBy: "budget" };
    const batch = queue.splice(0, options.batchSize);
    requests++;
    if (requests > 1 && options.delayMs) {
      await new Promise((r) => setTimeout(r, options.delayMs));
    }
    let ok = new Map<string, string>();
    try {
      const reply = await generateStructured({
        schema: summarySchema,
        prompt: buildSummaryPrompt(batch),
      });
      ok = validSummaries(
        reply,
        batch.map((b) => b.slug)
      );
    } catch (error) {
      if (error instanceof RateLimitError) {
        console.warn("⚠️  Rate limited; stopping. Rerun later to resume.");
        queue.unshift(...batch);
        return { requests, stoppedBy: "rate-limit" };
      }
      console.warn(
        `  request ${requests} failed: ${error instanceof Error ? error.message.slice(0, 120) : error}`
      );
    }
    for (const item of batch) {
      const summary = ok.get(item.slug);
      if (summary) {
        cache[item.slug] = { hash: item.hash, summary };
      } else {
        const n = (attempts.get(item.slug) ?? 0) + 1;
        attempts.set(item.slug, n);
        if (n < 2) queue.push(item);
      }
    }
    save(cache);
    console.log(
      `  request ${requests}: ${ok.size}/${batch.length} summarized, ${queue.length} left`
    );
  }
  return { requests, stoppedBy: "done" };
}
