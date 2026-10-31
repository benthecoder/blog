import {
  createLocalSearch,
  type LocalSearch,
  type SearchDocument,
} from "./localSearch";

let pending: Promise<LocalSearch> | undefined;

/** Shared by the page and modal; failed downloads can be retried. */
export function loadLocalSearch(): Promise<LocalSearch> {
  return (pending ??= fetch("/search-index.json")
    .then(async (response) => {
      if (!response.ok) throw new Error("Search index unavailable");
      return createLocalSearch((await response.json()) as SearchDocument[]);
    })
    .catch((error: unknown) => {
      pending = undefined;
      throw error;
    }));
}
