"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { photoFileUrl } from "@/utils/photoTransfer";

type Photo = { id: string; name: string; time: string };

export function PhotoPreview({
  photo,
  hasPrevious,
  hasNext,
  busy,
  error,
  onPrevious,
  onNext,
  onInsert,
  onClose,
}: {
  photo: Photo;
  hasPrevious: boolean;
  hasNext: boolean;
  busy: boolean;
  error: string;
  onPrevious: () => void;
  onNext: () => void;
  onInsert: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const ready = loadedId === photo.id;
  const failed = failedId === photo.id;
  const quietButton =
    "min-h-11 min-w-11 inline-flex items-center justify-center text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink dark:focus-visible:outline-chalk";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100vw-2rem)] max-w-4xl max-h-[calc(100dvh-2rem)] p-0 border border-rule dark:border-night-rule bg-paper dark:bg-night text-ink dark:text-chalk backdrop:bg-black/50"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
      onKeyDown={(event) => {
        if (busy) return;
        if (event.key === "ArrowLeft" && hasPrevious) {
          event.preventDefault();
          onPrevious();
        }
        if (event.key === "ArrowRight" && hasNext) {
          event.preventDefault();
          onNext();
        }
      }}
    >
      <header className="flex items-center justify-between gap-4 px-4 border-b border-rule dark:border-night-rule">
        <h2 id={titleId} className="text-sm truncate">
          {photo.name}
        </h2>
        <button
          onClick={onClose}
          disabled={busy}
          aria-label="Close photo preview"
          className={quietButton}
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </header>
      <div
        className="relative h-[60dvh] flex items-center justify-center bg-paper-sunken dark:bg-night-raised"
        aria-busy={!ready && !failed}
      >
        {!ready && !failed && (
          <Loader2
            aria-label="Loading photo"
            size={24}
            className="absolute motion-safe:animate-spin"
          />
        )}
        {/* Full-resolution local preview; the image is not uploaded by opening it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={photoFileUrl(photo.id, "full")}
          alt={photo.name}
          onLoad={() => setLoadedId(photo.id)}
          onError={() => setFailedId(photo.id)}
          className={`max-h-full max-w-full object-contain ${ready ? "opacity-100" : "opacity-0"}`}
        />
        {failed && (
          <p role="alert" className="absolute text-sm">
            Couldn’t load this photo.
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="px-4 py-2 text-sm">
          {error}
        </p>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious || busy}
            aria-label="Previous photo"
            className={quietButton}
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <span className="text-xs tabular-nums text-ink-soft dark:text-chalk-muted">
            {photo.time}
          </span>
          <button
            onClick={onNext}
            disabled={!hasNext || busy}
            aria-label="Next photo"
            className={quietButton}
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>
        <button
          onClick={onInsert}
          disabled={busy || !ready}
          className="min-h-11 px-4 text-sm bg-ink text-paper dark:bg-chalk dark:text-night disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink dark:focus-visible:outline-chalk"
        >
          {busy ? "Opening…" : "Insert photo"}
        </button>
      </footer>
    </dialog>
  );
}
