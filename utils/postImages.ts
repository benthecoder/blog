const imagePattern = /!\[[^\]]*\]\((\/images\/[^)\s]+)\)/g;

/** Images the post's Markdown embeds, in reading order. */
export function postImages(markdown: string) {
  const seen = new Set<string>();
  const images: { url: string; name: string }[] = [];
  for (const match of markdown.matchAll(imagePattern)) {
    const url = match[1];
    if (seen.has(url)) continue;
    seen.add(url);
    images.push({ url, name: url.slice(url.lastIndexOf("/") + 1) });
  }
  return images;
}

/**
 * The span to cut so an image leaves no gap: its Markdown plus the blank line
 * after it, or the one before it when it ends the document.
 */
export function imageRange(markdown: string, url: string) {
  for (const match of markdown.matchAll(imagePattern)) {
    if (match[1] !== url) continue;
    const start = match.index;
    const end = start + match[0].length;
    const after = /^\n{1,2}/.exec(markdown.slice(end));
    if (after) return { from: start, to: end + after[0].length };
    const before = /\n{1,2}$/.exec(markdown.slice(0, start));
    return { from: start - (before?.[0].length ?? 0), to: end };
  }
  return null;
}
