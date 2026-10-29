// A post that opens with a standalone image treats it as a hero: it renders
// above the table of contents instead of below it.
const IMAGE_LINE = /^!\[[^\]]*\]\([^)]*\)$/;

export function splitLeadingImage(markdown: string): {
  hero: string | null;
  body: string;
} {
  const lines = markdown.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;

  if (i < lines.length && IMAGE_LINE.test(lines[i].trim())) {
    return { hero: lines[i], body: lines.slice(i + 1).join("\n") };
  }
  return { hero: null, body: markdown };
}

// The hero's alt text and source, for a social card. Drops any link title.
export function heroImage(
  markdown: string
): { src: string; alt: string } | null {
  const { hero } = splitLeadingImage(markdown);
  const match = hero?.trim().match(/^!\[([^\]]*)\]\(\s*<?([^\s>)]+)>?/);
  return match ? { alt: match[1], src: match[2] } : null;
}
