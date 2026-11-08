"use client";

import { useEffect, useRef, useState } from "react";
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
  useTransitionStatus,
  FloatingPortal,
} from "@floating-ui/react";
import type { PostPreviewData } from "@/utils/content/preview";

// Only one card on screen: opening a preview closes whichever was open, so
// sweeping the cursor down a list never leaves a trail of cards behind.
const openPreview: { close: (() => void) | null } = { close: null };

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

  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    openPreview.close?.();
    openPreview.close = close;
    return () => {
      if (openPreview.close === close) openPreview.close = null;
    };
  }, [isOpen]);

  const { refs, floatingStyles, context, placement } = useFloating({
    open: isOpen,
    onOpenChange: (open, _event, reason) => {
      if (open && reason === "hover") {
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
      } else if (open) {
        refs.setPositionReference(refs.domReference.current);
      }
      setIsOpen(open);
      if (open && !preview && !fetched.current) {
        fetched.current = true;
        fetch(`/api/post-preview/${slug}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            fetched.current = Boolean(data);
            if (data) setPreview(data);
          })
          .catch(() => {
            fetched.current = false;
          });
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
  const { isMounted, status } = useTransitionStatus(context, {
    duration: { open: 150, close: 100 },
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
        prefetch={isOpen ? null : false}
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
            // The card is read-only; letting it take the pointer kept it open
            // whenever it covered the next link down the list.
            className="z-50 pointer-events-none"
            data-placement={placement}
          >
            <div
              data-status={status}
              className="post-link-preview max-w-xs p-3 rounded-md shadow-md border border-line bg-raised"
            >
              <p className="text-xs font-bold text-primary mb-0.5">
                {preview.title}
              </p>
              <p className="text-2xs text-secondary mb-1.5">
                {new Date(preview.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-caption leading-relaxed text-muted">
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
