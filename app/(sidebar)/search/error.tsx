"use client";

import { useEffect } from "react";

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center">
      <p className="text-sm text-ink/60 dark:text-chalk/60">
        search unavailable
      </p>
      <button
        onClick={reset}
        className="mt-4 text-xs text-ink dark:text-chalk opacity-60 hover:opacity-100 transition-opacity"
      >
        try again
      </button>
    </div>
  );
}
