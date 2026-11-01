"use client";

import { useEffect, useId, useRef } from "react";

export interface ConfirmConfig {
  title: string;
  message: string;
  onConfirm: () => void;
  /** Button labels; name the action, not "confirm". */
  labels: [cancel: string, confirm: string];
}

export function ConfirmModal({
  config,
  onCancel,
}: {
  config: ConfirmConfig;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto bg-surface border border-line p-8 max-w-md w-[calc(100vw-2rem)] backdrop:bg-night/40"
    >
      <h2
        id={titleId}
        className="text-lg font-light mb-4 text-accent tracking-wide"
      >
        {config.title}
      </h2>
      <p
        id={descriptionId}
        className="text-sm text-ink-soft dark:text-chalk-muted mb-8"
      >
        {config.message}
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="min-h-11 px-4 py-1.5 text-sm border border-line text-accent hover:border-accent transition-colors"
        >
          {config.labels[0]}
        </button>
        <button
          onClick={config.onConfirm}
          className="min-h-11 px-4 py-1.5 text-sm border border-accent text-accent hover:bg-accent hover:text-surface transition-colors"
        >
          {config.labels[1]}
        </button>
      </div>
    </dialog>
  );
}
