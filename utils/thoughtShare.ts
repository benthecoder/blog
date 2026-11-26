import { markdownToPlainText } from "@/utils/thoughtMarkdown";
import { parsePublicUrl, untitledLinkLabel } from "@/utils/tweets/link";

export const THOUGHT_OG_TITLE_MAX = 90;

const TZ = "America/New_York";

export const thoughtDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
});

export const thoughtTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Positive integer ids only; leading zeros are rejected so the path stays canonical. */
export function parseThoughtId(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

export function thoughtAnchorId(id: number): string {
  return `t-${id}`;
}

export function parseThoughtHash(hash: string): number | null {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  const match = /^t-([1-9]\d*)$/.exec(value);
  return match ? parseThoughtId(match[1]) : null;
}

export function truncatePlainText(
  text: string,
  max = THOUGHT_OG_TITLE_MAX
): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  const slice = trimmed.slice(0, max - 1);
  const at = slice.lastIndexOf(" ");
  const cut = at >= Math.floor(max * 0.6) ? slice.slice(0, at) : slice;
  return `${cut.replace(/[\s.,;:!?–—-]+$/u, "")}…`;
}

export function thoughtShareText(thought: {
  content: string;
  link?: string | null;
  titles?: Record<string, string>;
}): string {
  let text = markdownToPlainText(thought.content);
  const titles = thought.titles ?? {};
  for (const [url, title] of Object.entries(titles)) {
    if (!title) continue;
    text = text.replaceAll(url, title);
  }
  text = text.replace(/\s+/g, " ").trim();
  if (text) return truncatePlainText(text);

  const rawLink = thought.link;
  const href = rawLink ? (parsePublicUrl(rawLink) ?? rawLink) : null;
  if (href) {
    const title = titles[href] ?? (rawLink ? titles[rawLink] : undefined);
    if (title) return truncatePlainText(title);
    return untitledLinkLabel(href);
  }
  return "a thought";
}
