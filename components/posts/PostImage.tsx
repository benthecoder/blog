"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ImageMeta } from "@/utils/content/imageMeta";

export default function PostImage({
  src,
  alt,
  meta,
}: {
  src: string;
  alt: string;
  meta?: ImageMeta | null;
}) {
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // Drives the enter transition: the overlay mounts hidden, then animates in
  // on the next frame. Setting the final state immediately would skip it.
  const [entered, setEntered] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // A cached image can finish loading before React attaches onLoad, which
  // would strand the fade at opacity-0 and leave a blank frame. Catch that
  // case on mount by asking the element whether it's already done.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  // Without a blur placeholder (drafts, unknown images), fall back to the
  // opacity fade so images never pop in abruptly.
  const fadeIn = !meta?.blurDataURL;

  const close = useCallback(() => {
    setEntered(false);
    setExpanded(false);
    // Send focus back to the plate, or the page loses its place.
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!expanded) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    // Lock scroll behind the overlay, preserving the gutter so the page
    // doesn't shift sideways as the scrollbar disappears.
    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;

    const raf = requestAnimationFrame(() => {
      setEntered(true);
      closeRef.current?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      cancelAnimationFrame(raf);
    };
  }, [expanded, close]);

  return (
    <figure className="my-8 not-prose">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setExpanded(true)}
        aria-label={alt ? `Expand image: ${alt}` : "Expand image"}
        // outline-none kills the ring a mouse click would leave behind;
        // focus-visible still shows one for keyboard users, who need it.
        className="photo-frame block w-full cursor-zoom-in border-0 outline-none focus-visible:ring-2 focus-visible:ring-ink/40 dark:focus-visible:ring-chalk/40"
      >
        {/* Every plate is square regardless of the source aspect, so a run of
            photos hangs on a consistent line. The full frame is one click
            away, so nothing is actually lost. */}
        <div className="photo-plate relative aspect-square w-full overflow-hidden rounded-[calc(var(--radius-image)-2px)]">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 800px) 100vw, 800px"
            placeholder={meta?.blurDataURL ? "blur" : "empty"}
            blurDataURL={meta?.blurDataURL}
            onLoad={() => setLoaded(true)}
            className={`object-cover ${
              fadeIn
                ? `transition-opacity duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${loaded ? "opacity-100" : "opacity-0"}`
                : ""
            }`}
          />
        </div>
      </button>

      {alt && (
        <figcaption className="photo-label mt-3 text-center">{alt}</figcaption>
      )}

      {expanded &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={alt || "Expanded image"}
            onClick={close}
            className={`fixed inset-0 z-100 flex flex-col items-center justify-center gap-4 p-6 sm:p-12 cursor-zoom-out bg-night/90 backdrop-blur-sm transition-opacity duration-200 ease-out motion-reduce:transition-none ${
              entered ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Portalled to <body>, so the square crop above doesn't reach it
                — this is the whole picture, uncropped. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              onClick={(e) => e.stopPropagation()}
              className={`max-h-[85vh] max-w-full object-contain rounded-image cursor-default shadow-2xl transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
                entered ? "scale-100" : "scale-[0.97]"
              }`}
            />
            {alt && (
              // Not .photo-label: that resolves to the light-mode ink colour,
              // and this overlay is dark in both themes.
              <figcaption className="max-w-prose text-center text-[0.6875rem] lowercase tracking-[0.08em] text-chalk-soft">
                {alt}
              </figcaption>
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close expanded image"
              className="absolute top-5 right-5 text-xs tracking-widest text-chalk-muted hover:text-chalk-strong transition-colors outline-none focus-visible:ring-2 focus-visible:ring-chalk/40 rounded-xs px-2 py-1"
            >
              esc
            </button>
          </div>,
          document.body
        )}
    </figure>
  );
}
