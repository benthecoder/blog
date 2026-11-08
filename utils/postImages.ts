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
