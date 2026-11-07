/** Entries come back as one line of text; break senses onto their own lines. */
export function entryLines(text: string) {
  return text
    .replace(/ • /g, "\n• ")
    .replace(/ (\d{1,2}) (?=[a-z])/g, "\n$1 ")
    .replace(/ ANTONYMS /g, "\nantonyms: ")
    .split("\n");
}

/** The first sense of a dictionary entry, short enough for a bubble. */
export function shortDefinition(text: string, max = 150) {
  const lines = entryLines(text);
  const sense = lines.find((line) => /^(•|\d{1,2}) /.test(line)) ?? lines[0];
  const plain = sense.replace(/^(•|\d{1,2}) /, "");
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}…` : plain;
}

/** A thesaurus line as alternating words and separators; words can be swapped in. */
export function synonymParts(line: string) {
  return line
    .replace(/^(•|\d{1,2}) /, "")
    .split(/([,;]\s*)/)
    .filter(Boolean)
    .map((part) => ({
      text: part,
      swappable: /^[A-Za-z][A-Za-z'-]*(?: [A-Za-z'-]+){0,2}$/.test(part),
    }));
}
