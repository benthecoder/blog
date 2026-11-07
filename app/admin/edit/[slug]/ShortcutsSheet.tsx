"use client";

import { useEffect, useId, useRef } from "react";

export function ShortcutsSheet({
  primary,
  isEssay,
  onClose,
}: {
  /** What ⌘⏎ does here: save, update, or publish. */
  primary: string;
  isEssay: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const shortcuts: [keys: string, action: string][] = [
    ["⌘⏎", primary],
    ["⌘S", "save"],
    ["⌘⇧P", "preview"],
    ["⌘⇧⏎", "focus mode"],
    ["⌘\\", "editor width"],
    ["⌘B", "bold"],
    ["⌘I", "italic"],
    ["⌘K", "link"],
    ...(isEssay
      ? []
      : ([
          ["⌘[  ⌘]", "previous, next day"],
          ["⌘⇧[  ⌘⇧]", "previous, next month"],
        ] as [string, string][])),
    ["⌘.", isEssay ? "back to essays" : "back to calendar"],
    ["esc", "leave the text, or exit focus"],
    ["? or ⌘/", "this list"],
  ];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto bg-surface text-primary border border-line p-8 max-w-sm w-[calc(100vw-2rem)] backdrop:bg-night/40"
    >
      <h2 id={titleId} className="text-lg font-light mb-6 text-accent">
        shortcuts
      </h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        {shortcuts.map(([keys, action]) => (
          <div key={keys} className="contents">
            <dt className="text-muted tabular-nums whitespace-nowrap">
              {keys}
            </dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
    </dialog>
  );
}
