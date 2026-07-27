"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
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
  FloatingPortal,
  safePolygon,
} from "@floating-ui/react";
import type { PostPreviewData } from "@/utils/content/preview";

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

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !preview && !fetched.current) {
      fetched.current = true;
      fetch(`/api/post-preview/${slug}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setPreview(data))
        .catch(() => {});
    }
  };

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange,
    placement: "top",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: 8 }),
    ],
  });

  const hover = useHover(context, {
    move: false,
    delay: { open: 150, close: 0 },
    handleClose: safePolygon(),
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <Link
        href={`/posts/${slug}`}
        ref={refs.setReference}
        className={className}
        {...getReferenceProps()}
      >
        {children}
      </Link>
      {isOpen && preview && (
        <FloatingPortal>
          <div
            // floating-ui's refs object exposes callback refs by design
            // eslint-disable-next-line react-hooks/refs
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 max-w-xs p-3 rounded-md shadow-md border border-rule dark:border-white/10 bg-paper-raised dark:bg-night-raised"
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
            <p className="text-[11px] leading-relaxed text-ink-muted dark:text-ink-soft">
              {preview.excerpt}
            </p>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

export default PostLinkPreview;
