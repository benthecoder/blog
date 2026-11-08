/**
 * Rewrites the alt text of the image at `src`, which the post renders as its
 * caption. Brackets are escaped so the caption can't close the image early.
 */
export function setImageCaption(
  markdown: string,
  src: string,
  caption: string
) {
  const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const image = new RegExp(`!\\[(?:\\\\.|[^\\]\\\\])*\\]\\(${escapedSrc}\\)`);
  const alt = caption.replace(/[[\]\\]/g, "\\$&");
  return markdown.replace(image, () => `![${alt}](${src})`);
}
