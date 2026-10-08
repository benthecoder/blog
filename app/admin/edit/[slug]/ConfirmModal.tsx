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
      className="m-auto bg-paper dark:bg-night border border-rule dark:border-night-rule p-8 max-w-md w-[calc(100vw-2rem)] backdrop:bg-black/40"
    >
      <h2
        id={titleId}
        className="text-lg font-light mb-4 text-ink dark:text-chalk tracking-wide"
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
          className="min-h-11 px-4 py-1.5 text-sm border border-rule dark:border-night-rule text-ink dark:text-chalk hover:border-ink dark:hover:border-chalk transition-colors"
        >
          {config.labels[0]}
        </button>
        <button
          onClick={config.onConfirm}
          className="min-h-11 px-4 py-1.5 text-sm border border-ink dark:border-chalk text-ink dark:text-chalk hover:bg-ink hover:text-white dark:hover:bg-chalk dark:hover:text-night transition-colors"
        >
          {config.labels[1]}
        </button>
      </div>
    </dialog>
  );
}
