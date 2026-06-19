"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4 text-center">
      <p className="text-japanese-sumiiro/60 dark:text-japanese-shironezu/60 text-sm">
        something went wrong
      </p>
      <button
        onClick={reset}
        className="text-sm text-japanese-sumiiro dark:text-japanese-shironezu opacity-60 hover:opacity-100 transition-opacity"
      >
        try again
      </button>
    </div>
  );
}
