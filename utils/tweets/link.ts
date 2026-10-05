const MAX_HTML = 200_000;
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

export function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  const title = decodeEntities(m[1]).replace(/\s+/g, " ").trim();
  return title ? title.slice(0, MAX_TITLE) : null;
}

/** Fetch a page and return its <title>, reading at most ~200KB. */
export async function fetchTitle(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "manual",
    });
    if (!res.ok || !res.body) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let html = "";
    while (html.length < MAX_HTML) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (/<\/title>/i.test(html)) break;
    }
    await reader.cancel().catch(() => {});
    return extractTitle(html);
  } catch {
    return null;
  }
}
