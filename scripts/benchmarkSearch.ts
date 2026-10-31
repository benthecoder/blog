import { gzipSync } from "node:zlib";
import { buildSearchDocuments } from "../utils/content/searchIndex";
import { createLocalSearch } from "../utils/localSearch";

// Query evaluation only: excludes download, JSON parsing, and React rendering.
const documents = buildSearchDocuments();
const started = performance.now();
const search = createLocalSearch(documents);
const setupMs = performance.now() - started;
const queries = [
  "fe",
  "programming",
  "taipei",
  "life",
  "machine learning",
  "yosemite",
  "nonexistentxyz",
  "#travel",
  "a",
  "the",
];
const times: number[] = [];
for (let index = 0; index < 500; index++) {
  const start = performance.now();
  search(queries[index % queries.length]);
  times.push(performance.now() - start);
}
times.sort((a, b) => a - b);
console.log(
  JSON.stringify(
    {
      posts: documents.length,
      gzipBytes: gzipSync(JSON.stringify(documents)).length,
      setupMs,
      medianMs: times[250],
      p95Ms: times[475],
      maxMs: times.at(-1),
    },
    null,
    2
  )
);
