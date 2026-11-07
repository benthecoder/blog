"use client";

import { useEffect, useId, useRef } from "react";
import { animateIn } from "@/components/admin/enterAnimation";

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
    if (dialog) {
      dialog.showModal();
      animateIn(dialog, { from: 0.96, duration: 150, origin: "50% 50%" });
    }
    return () => dialog?.close();
  }, []);

  const shortcuts: [keys: string, action: string][] = [
    ["⌘⏎", primary],
    ["⌘S", "save"],
    ["⌘⇧P", "preview"],
    ["⌘⇧⏎", "focus mode"],
    ["⌥⌘P", "photo tray"],
    ["⌘\\", "editor width"],
    ["⌘B", "bold"],
    ["⌘I", "italic"],
    ["⌘K", "link"],
    ["⌘D or tab", "expand the definition of a selected word"],
    ["arrows", "move through the tray"],
    ["⏎  space", "insert, preview a tray photo"],
    ["⌫", "remove a tray image from the post"],
    ["R", "rotate in the preview"],
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
      className="m-auto bg-raised text-primary rounded-xs shadow-lg p-8 max-w-sm w-[calc(100vw-2rem)] outline-none backdrop:bg-night/40"
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
