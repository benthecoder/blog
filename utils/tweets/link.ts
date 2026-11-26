const MAX_TITLE = 300;

const BLOCKED_HOST =
  /^(localhost|.*\.(local|localhost|internal|lan|home|test))$|^\[|^\d+\.\d+\.\d+\.\d+$|^\d+$/i;

/**
 * Returns the normalised URL if it is a public-looking http(s) address, else
 * null. IP literals and local hostnames are rejected so a stored link can't
 * point the title fetch at internal services.
 */
export function parsePublicUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    if (BLOCKED_HOST.test(u.hostname) || !u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code =
        e[1].toLowerCase() === "x"
          ? parseInt(e.slice(2), 16)
          : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

function attr(tag: string, name: string): string | null {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")
  );
  if (!match) return null;
  return decodeEntities(match[1] ?? match[2] ?? match[3] ?? "");
}

function metaContent(
  html: string,
  key: "property" | "name",
  value: string
): string | null {
  const needle = value.toLowerCase();
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (attr(tag, key)?.toLowerCase() !== needle) continue;
    const content = attr(tag, "content")?.replace(/\s+/g, " ").trim();
    if (content) return content.slice(0, MAX_TITLE);
  }
  return null;
}

/** Prefer og:title, then twitter:title, then the document title. */
export function extractTitle(html: string): string | null {
  const titled =
    metaContent(html, "property", "og:title") ??
    metaContent(html, "name", "twitter:title");
  if (titled) return titled;
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return null;
  const title = decodeEntities(match[1]).replace(/\s+/g, " ").trim();
  return title ? title.slice(0, MAX_TITLE) : null;
}

/** Hostname without a leading www. */
export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Fallback label when a title cannot be fetched: `hostname/path`,
 * with the trailing slash dropped and `www.` removed.
 */
export function untitledLinkLabel(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = `${parsed.pathname}${parsed.search}`.replace(/\/$/, "");
    return path ? `${host}${path}` : host;
  } catch {
    return url;
  }
}

/** True when the link text is just the URL itself (a bare / autolinked URL). */
export function isBareUrlLabel(text: string, href: string): boolean {
  const label = text.trim();
  const target = href.trim();
  if (!label || !target) return false;
  const strip = (value: string) => value.replace(/\/$/, "");
  if (label === target || strip(label) === strip(target)) return true;
  const publicHref = parsePublicUrl(target);
  return publicHref !== null && strip(label) === strip(publicHref);
}
