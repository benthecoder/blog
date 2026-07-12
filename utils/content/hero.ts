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
