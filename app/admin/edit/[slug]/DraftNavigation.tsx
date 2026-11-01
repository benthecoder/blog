"use client";

import { useEffect, useState, type ReactNode } from "react";
import { nextDraft, type DraftSummary } from "@/utils/adminDraftQueue";

export function DraftNavigation({
  slug,
  date,
  isDraft,
  disabled,
  onNext,
  metadata,
  saveStatus,
}: {
  slug: string;
  date: string;
  isDraft: boolean;
  disabled: boolean;
  onNext: (slug: string | null) => Promise<void>;
  metadata: ReactNode;
  saveStatus: ReactNode;
}) {
  const [queue, setQueue] = useState<DraftSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [moving, setMoving] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/drafts", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw Error("Could not load drafts");
        return response.json() as Promise<DraftSummary[]>;
      })
      .then((drafts) => {
        if (!controller.signal.aborted) {
          setQueue(drafts);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [slug, isDraft, retry]);
  const next = queue && nextDraft(queue, slug, date);
  return (
    <nav
      aria-label="Draft progress"
      className="flex w-full items-center justify-between gap-4 text-xs text-ink-soft dark:text-chalk-muted"
    >
      <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
        {metadata}
        <span role="status" className="tabular-nums">
          {failed
            ? "couldn’t load drafts"
            : queue
              ? `${queue.length} ${queue.length === 1 ? "draft" : "drafts"} left`
              : "loading drafts…"}
        </span>
      </div>
      <div className="shrink-0 flex items-center gap-3">
        <span className="hidden sm:inline">{saveStatus}</span>
        {failed ? (
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="focus-ring min-h-9 underline"
          >
            try again
          </button>
        ) : queue && (next || isDraft) ? (
          <button
            type="button"
            disabled={disabled || moving}
            title={
              isDraft
                ? next
                  ? `Publish this post, then open ${next.title}`
                  : "Publish the last draft"
                : next?.title
            }
            onClick={async () => {
              setMoving(true);
              try {
                await onNext(next?.slug ?? null);
              } finally {
                setMoving(false);
              }
            }}
            className="min-h-10 px-3 border-l border-line text-accent hover:bg-paper-sunken dark:hover:bg-night-raised disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent"
          >
            {moving
              ? isDraft
                ? "publishing…"
                : "saving…"
              : isDraft
                ? next
                  ? "publish & next →"
                  : "publish"
                : "next draft →"}
          </button>
        ) : (
          queue && (
            <span>{queue.length === 0 ? "all caught up" : "last draft"}</span>
          )
        )}
      </div>
    </nav>
  );
}
