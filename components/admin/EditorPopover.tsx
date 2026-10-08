"use client";

import { useState, type ReactNode } from "react";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  useDismiss,
  useInteractions,
  useRole,
  FloatingFocusManager,
  FloatingPortal,
} from "@floating-ui/react";

export function EditorPopover({
  label,
  children,
  name,
  disabled = false,
  align = "start",
}: {
  label: ReactNode;
  children: (close: () => void) => ReactNode;
  name: string;
  disabled?: boolean;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: `bottom-${align}`,
    middleware: [offset(10), flip(), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    dismiss,
    role,
  ]);
  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        aria-label={name}
        aria-expanded={open}
        className="min-h-11 sm:min-h-9 inline-flex items-center gap-2 text-sm text-ink dark:text-chalk disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink dark:focus-visible:outline-chalk"
      >
        <span className="decoration-ink/25 dark:decoration-chalk/25 underline underline-offset-4 decoration-dotted hover:decoration-solid">
          {label}
        </span>
        <span
          aria-hidden="true"
          className="text-ink-muted dark:text-chalk-muted text-[10px]"
        >
          ⌄
        </span>
      </button>
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              aria-label={name}
              className="z-110 w-60 max-w-[calc(100vw-24px)] bg-paper dark:bg-night-raised text-ink dark:text-chalk border border-rule dark:border-night-rule shadow-lg p-3"
            >
              {children(() => setOpen(false))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
