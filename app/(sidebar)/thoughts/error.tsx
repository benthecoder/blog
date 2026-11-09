"use client";

import { useEffect } from "react";

export default function ThoughtsError({
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
    <div className="max-w-3xl mx-auto px-6 py-12 text-center">
      <p className="text-sm text-accent/60">couldn&apos;t load thoughts</p>
      <button
        onClick={reset}
        className="focus-ring mt-4 text-xs text-accent opacity-60 hover:opacity-100 transition-opacity"
      >
        try again
      </button>
    </div>
  );
}
