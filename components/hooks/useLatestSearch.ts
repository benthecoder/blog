"use client";

import { useCallback, useEffect, useState } from "react";
import { LatestSearch, type SearchInput } from "@/utils/latestSearch";
import type { SearchResultItem } from "@/types/search";

export function useLatestSearch() {
  const [request] = useState(() => new LatestSearch());
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  useEffect(() => () => request.cancel(), [request]);

  const cancel = useCallback(() => {
    request.cancel();
    setResults([]);
    setError("");
    setIsLoading(false);
    setHasSearched(false);
  }, [request]);

  const execute = useCallback(
    async (input: SearchInput) => {
      if (!input.query.trim()) {
        cancel();
        return;
      }
      setResults([]);
      setError("");
      setIsLoading(true);
      setHasSearched(false);
      const outcome = await request.run(input);
      if (!outcome) return;
      setResults(outcome.results);
      setError(outcome.error);
      setIsLoading(false);
      setHasSearched(true);
    },
    [request, cancel]
  );

  return { results, error, isLoading, hasSearched, execute, cancel };
}
