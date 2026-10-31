"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchExplorer from "@/components/search/SearchExplorer";
import type { ChunkType } from "@/types/chunks";

function SearchContent() {
  const params = useSearchParams();
  const type = params.get("type");
  const chunk = params.get("chunkType");
  const chunkType: ChunkType | "" =
    chunk === "code" ||
    chunk === "quote" ||
    chunk === "section" ||
    chunk === "full-post"
      ? chunk
      : "";
  return (
    <SearchExplorer
      initialQuery={params.get("q") ?? ""}
      initialType={type === "semantic" || type === "hybrid" ? type : "keyword"}
      initialChunk={chunkType}
    />
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">loading search…</p>}>
      <SearchContent />
    </Suspense>
  );
}
