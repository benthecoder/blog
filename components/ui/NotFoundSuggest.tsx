"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { suggestPaths, type PathEntry } from "@/utils/suggestPaths";

export default function NotFoundSuggest() {
  const pathname = usePathname();
  const [suggestions, setSuggestions] = useState<PathEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/paths")
      .then((r) => (r.ok ? r.json() : []))
      .then((entries: PathEntry[]) => {
        if (!cancelled) setSuggestions(suggestPaths(pathname, entries));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!suggestions.length) return null;

  return (
    <div className="flex flex-col items-center gap-1 text-sm text-accent/60">
      <p>maybe you meant:</p>
      {suggestions.map((s) => (
        <Link
          key={s.path}
          href={s.path}
          className="pointer-events-auto text-accent opacity-60 hover:opacity-100 transition-opacity"
        >
          {s.title}
        </Link>
      ))}
    </div>
  );
}
