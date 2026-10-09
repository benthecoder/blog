import { stripScaffolding } from "./postVectors";

const STOPWORDS = new Set(
  `a about after again all also am an and any are as at be because been but by can could day did do does done for from get got had has have he her here him his how i if in into is it its just like me more most my no not now of on one only or our out over so some than that the their them then there these they this to too up us very was we were what when where which who why will with would you your dont ive im its isnt thats youre also really much even still things thing want need know think going back first today good well make made way people time year years week`.split(
    /\s+/
  )
);

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? [])
    .map((t) => t.replace(/'s$/, ""))
    .filter((t) => !STOPWORDS.has(t.replace(/['-]/g, "")));
}

export interface TermDoc {
  title: string;
  content: string;
}

/**
 * Class-based TF-IDF: treat each cluster as one document and rank terms by
 * how much more they matter there than across all clusters. Titles count
 * triple since they are the densest signal.
 */
export function distinctiveTerms(
  clusters: Map<number, TermDoc[]>,
  topN: number
): Map<number, string[]> {
  const tf = new Map<number, Map<string, number>>();
  const classFreq = new Map<string, number>();
  let totalTokens = 0;

  for (const [id, docs] of clusters) {
    const counts = new Map<string, number>();
    for (const doc of docs) {
      const body = tokenize(stripScaffolding(doc.content).slice(0, 1500));
      const title = tokenize(doc.title);
      for (const t of body) counts.set(t, (counts.get(t) ?? 0) + 1);
      for (const t of title) counts.set(t, (counts.get(t) ?? 0) + 3);
    }
    tf.set(id, counts);
    counts.forEach((c, t) => {
      totalTokens += c;
      classFreq.set(t, (classFreq.get(t) ?? 0) + c);
    });
  }

  const avgPerClass = totalTokens / Math.max(clusters.size, 1);
  const out = new Map<number, string[]>();
  for (const [id, counts] of tf) {
    const size = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1;
    const scored = Array.from(counts, ([term, count]) => {
      const idf = Math.log(1 + avgPerClass / classFreq.get(term)!);
      return { term, score: (count / size) * idf, count };
    })
      .filter((s) => s.count >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map((s) => s.term);
    out.set(id, scored);
  }
  return out;
}

/** Indices of `members` sorted by distance to their mean vector. */
export function nearestToCentroid(
  vectors: number[][],
  members: number[]
): number[] {
  if (members.length === 0) return [];
  const dim = vectors[members[0]].length;
  const centroid = Array.from({ length: dim }, () => 0);
  for (const m of members)
    for (let i = 0; i < dim; i++) centroid[i] += vectors[m][i] / members.length;
  const dist = (m: number) => {
    let s = 0;
    for (let i = 0; i < dim; i++) s += (vectors[m][i] - centroid[i]) ** 2;
    return s;
  };
  return members
    .map((m) => ({ m, d: dist(m) }))
    .sort((a, b) => a.d - b.d)
    .map((x) => x.m);
}
