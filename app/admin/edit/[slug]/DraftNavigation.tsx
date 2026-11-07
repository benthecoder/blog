"use client";

import { useEffect, useState, type ReactNode } from "react";
import { nextDraft, type DraftSummary } from "@/utils/adminDraftQueue";

const actionCls =
  "min-h-10 px-3 border-l border-line text-accent hover:bg-paper-sunken dark:hover:bg-night-raised disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-accent";

export function DraftNavigation({
  slug,
  date,
  isDraft,
  dirty,
  disabled,
  onNext,
  onSave,
  words,
  saveStatus,
}: {
  slug: string;
  date: string;
  isDraft: boolean;
  /** Unsaved edits to a live post. */
  dirty: boolean;
  disabled: boolean;
  onNext: (slug: string | null) => Promise<void>;
  onSave: () => void;
  words: ReactNode;
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
  const left = queue
    ? ` (${queue.length} ${queue.length === 1 ? "draft" : "drafts"} left)`
    : "";
  return (
    <nav
      aria-label="Draft progress"
      className="flex w-full items-center justify-between gap-4 text-xs text-ink-soft dark:text-chalk-muted"
    >
      {words}
      <div className="shrink-0 flex items-center gap-3">
        <span className="hidden sm:inline">{saveStatus}</span>
        {!isDraft && dirty ? (
          <button
            type="button"
            disabled={disabled}
            title="update (⌘⏎)"
            onClick={onSave}
            className={actionCls}
          >
            update
          </button>
        ) : failed ? (
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="focus-ring min-h-9 underline"
          >
            couldn’t load drafts, try again
          </button>
        ) : queue && (next || isDraft) ? (
          <button
            type="button"
            disabled={disabled || moving}
            title={
              (isDraft
                ? next
                  ? `Publish this post, then open ${next.title}`
                  : "Publish the last draft"
                : next?.title) + left
            }
            onClick={async () => {
              setMoving(true);
              try {
                await onNext(next?.slug ?? null);
              } finally {
                setMoving(false);
              }
            }}
            className={actionCls}
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
        ) : null}
      </div>
    </nav>
  );
}
