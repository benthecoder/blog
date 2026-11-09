const WORD_CHAR = "[\\p{L}\\p{N}'’]";
// Scripts written without spaces have no word boundaries to respect.
const UNSPACED =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}]/u;
const STOPWORDS = new Set(
  "a an and are as at be but by for from i if in is it me my of on or so that the this to was we with you".split(
    " "
  )
);

/** Lowercased, deduplicated query words, without a leading `#`. */
export const searchTerms = (query: string): string[] => [
  ...new Set(
    query
      .trim()
      .toLocaleLowerCase()
      .slice(0, 500)
      .replace(/^#/, "")
      .split(/\s+/)
      .filter(Boolean)
  ),
];

export const isStopword = (term: string) => STOPWORDS.has(term);

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Terms match from the start of a word, so "japan" finds "japanese" and
 * "progr" finds "programming" while typing, but "way" skips "Hemingway".
 * Short words and stopwords must be the whole word, or "it" hits "writing".
 */
const termSource = (term: string) => {
  const body = escape(term);
  if (UNSPACED.test(term)) return body;
  const start = `(?<!${WORD_CHAR})`;
  return term.length >= 3 && !isStopword(term)
    ? `${start}${body}`
    : `${start}${body}(?!${WORD_CHAR})`;
};

/** One case-insensitive matcher per term, in query order. */
export const termMatchers = (terms: string[]): RegExp[] =>
  terms.map((term) => new RegExp(termSource(term), "iu"));

/**
 * A global matcher for highlighting. Stopwords are required to match but not
 * marked when the query has other words, so "i want it" does not paint every "I".
 */
export function highlightMatcher(terms: string[]): RegExp | null {
  if (!terms.length) return null;
  const content = terms.filter((term) => !isStopword(term));
  const marked = content.length ? content : terms;
  const sources = marked.map(termSource).sort((a, b) => b.length - a.length);
  return new RegExp(sources.join("|"), "giu");
}
