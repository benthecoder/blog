/** A complete saved sentence, never an arbitrary word-count slice. */
export function highlightExcerpt(text: string): string {
  const clean = text
    .replace(/\[\d+(?:[\s,–-]+\d+)*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "";
  // Sentence segmentation otherwise splits Mozart's '(KV. 453)' and common abbreviations.
  const protectedText = clean
    .replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|St|Sr|Jr|vs|etc|KV|No)\./g, (word) =>
      word.replace(/\./g, "\uE000")
    )
    .replace(/\b(?:U\.S\.|U\.K\.|e\.g\.|i\.e\.)/g, (word) =>
      word.replace(/\./g, "\uE000")
    );
  const first = [
    ...new Intl.Segmenter("en", { granularity: "sentence" }).segment(
      protectedText
    ),
  ][0]?.segment.trim();
  return (first ?? protectedText).replace(/\uE000/g, ".");
}
