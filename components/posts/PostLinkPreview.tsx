"use client";

import { useState } from "react";
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

// Hover card for internal post links inside markdown. The preview data is
// resolved on the server (see MarkdownContent) so this ships no fetch logic.
const PostLinkPreview = ({
  preview,
  children,
}: {
  preview: PostPreviewData;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
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
        href={`/posts/${preview.slug}`}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {children}
      </Link>
      {isOpen && (
        <FloatingPortal>
          <div
            // floating-ui's refs object exposes callback refs by design
            // eslint-disable-next-line react-hooks/refs
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 max-w-xs p-3 rounded-md shadow-md border border-japanese-shiraumenezu dark:border-white/10 bg-japanese-hakuji dark:bg-dark-tag"
          >
            <p className="text-xs font-bold text-japanese-sumiiro dark:text-japanese-nyuhakushoku mb-0.5">
              {preview.title}
            </p>
            <p className="text-[10px] text-japanese-ginnezu mb-1.5">
              {new Date(preview.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-[11px] leading-relaxed text-japanese-nezumiiro dark:text-japanese-ginnezu">
              {preview.excerpt}
            </p>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

export default PostLinkPreview;
