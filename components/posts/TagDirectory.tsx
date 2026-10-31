"use client";

import Link from "next/link";
import { useState } from "react";

export default function TagDirectory({ tags }: { tags: [string, number][] }) {
  const [prefetchTag, setPrefetchTag] = useState<string | null>(null);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-0">
      {tags.map(([tag, count]) => (
        <Link
          key={tag}
          href={`/tags/${encodeURIComponent(tag)}`}
          title={`#${tag}`}
          prefetch={prefetchTag === tag ? null : false}
          onMouseEnter={() => setPrefetchTag(tag)}
          onFocus={() => setPrefetchTag(tag)}
          className="min-w-0 border border-line hover:bg-accent/5 px-2 py-1.5 flex justify-between items-center gap-3 transition-colors duration-150"
        >
          <span className="min-w-0 text-xs text-accent [overflow-wrap:anywhere]">
            #{tag}
          </span>
          <span className="text-[10px] text-accent/30 font-mono shrink-0">
            {count}
          </span>
        </Link>
      ))}
    </div>
  );
}
