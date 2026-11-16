export type Belief = { text: string; reasons: string[] };

/** Parses believe.md: `- belief` lines, each followed by any number of
    indented `  - reason` lines. Throws on anything else. */
export function parseBeliefs(markdown: string): Belief[] {
  const beliefs: Belief[] = [];
  for (const line of markdown.split("\n")) {
    if (!line.trim()) continue;
    const belief = /^- (.+)$/.exec(line);
    const reason = /^\s{2,}- (.+)$/.exec(line);
    if (belief) beliefs.push({ text: belief[1].trim(), reasons: [] });
    else if (reason && beliefs.length > 0)
      beliefs.at(-1)!.reasons.push(reason[1].trim());
    else
      throw new Error(
        `believe.md: expected "- belief" or "  - reason": ${line}`
      );
  }
  if (beliefs.length === 0) throw new Error("believe.md has no beliefs");
  return beliefs;
}
