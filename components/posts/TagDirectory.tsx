"use client";

import Link from "next/link";
import { useState } from "react";

export default function TagDirectory({ tags }: { tags: [string, number][] }) {
  const [prefetchTag, setPrefetchTag] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-0">
      {tags.map(([tag, count]) => (
        <Link
          key={tag}
          href={`/tags/${encodeURIComponent(tag)}`}
          title={`#${tag}`}
          prefetch={prefetchTag === tag ? null : false}
          onMouseEnter={() => setPrefetchTag(tag)}
          onFocus={() => setPrefetchTag(tag)}
          className="border border-rule dark:border-night-raised hover:bg-accent/5 px-2 py-1.5 flex justify-between items-center gap-1.5 transition-colors duration-150"
        >
          <span className="text-xs text-accent truncate">#{tag}</span>
          <span className="text-[10px] text-accent/30 font-mono shrink-0">
            {count}
          </span>
        </Link>
      ))}
    </div>
  );
}
