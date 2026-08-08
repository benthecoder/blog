"use client";

import { useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import Link from "next/link";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  useTransitionStyles,
  FloatingPortal,
} from "@floating-ui/react";
import type { PostPreviewData } from "@/utils/content/preview";

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

// Hover card for internal post links. Markdown links pass `preview` resolved
// on the server; list contexts with too many posts to inline (e.g. the
// archive) pass only `slug` and the data is fetched once on first hover.
const PostLinkPreview = ({
  slug,
  preview: initialPreview,
  className,
  children,
}: {
  slug: string;
  preview?: PostPreviewData;
  className?: string;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState(initialPreview ?? null);
  const fetched = useRef(false);
  const pointerPos = useRef({ x: 0, y: 0 });

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (open) {
        // Anchor to wherever the cursor is right now, once. Re-anchoring on
        // every pointermove made `flip` re-decide above-vs-below mid-hover,
        // snapping the card between the two.
        const { x, y } = pointerPos.current;
        refs.setPositionReference({
          getBoundingClientRect: () => ({
            x,
            y,
            top: y,
            left: x,
            right: x,
            bottom: y,
            width: 0,
            height: 0,
          }),
        });
      }
      setIsOpen(open);
      if (open && !preview && !fetched.current) {
        fetched.current = true;
        fetch(`/api/post-preview/${slug}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => data && setPreview(data))
          .catch(() => {});
      }
    },
    placement: "top",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(14),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: 8 }),
    ],
  });

  const hover = useHover(context, {
    move: false,
    delay: { open: 150, close: 0 },
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  // Scale/opacity enter-exit, decoupled from the position transform below so
  // each can ease independently.
  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: { open: 150, close: 100 },
    initial: { opacity: 0, transform: "scale(0.94)" },
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  const handlePointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== "mouse") return;
    pointerPos.current = { x: event.clientX, y: event.clientY };
  };

  return (
    <>
      <Link
        href={`/posts/${slug}`}
        ref={refs.setReference}
        onPointerMove={handlePointerMove}
        className={className}
        {...getReferenceProps()}
      >
        {children}
      </Link>
      {isMounted && preview && (
        <FloatingPortal>
          <div
            // floating-ui's refs object exposes callback refs by design
            // eslint-disable-next-line react-hooks/refs
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 pointer-events-none"
          >
            <div
              style={{
                ...transitionStyles,
                transitionTimingFunction: EASE_OUT,
              }}
              className="origin-bottom max-w-xs p-3 rounded-md shadow-md border border-rule dark:border-white/10 bg-paper-raised dark:bg-night-raised"
            >
              <p className="text-xs font-bold text-ink dark:text-chalk-strong mb-0.5">
                {preview.title}
              </p>
              <p className="text-[10px] text-ink-soft mb-1.5">
                {new Date(preview.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-[11px] leading-relaxed text-ink-muted dark:text-chalk-muted">
                {preview.excerpt}
              </p>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

export default PostLinkPreview;
