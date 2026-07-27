"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GalleryImage } from "@/utils/content/gallery";

interface GalleryProps {
  images: GalleryImage[];
}

type ViewMode = "grid" | "original";

// iOS Photos-style zoom steps: fewer columns = bigger photos.
// Pinch (touch or trackpad) moves between steps.
const COLUMN_STEPS = [2, 3, 4, 6, 8];
const DEFAULT_STEP = 2; // 4 columns

// Strong curves per animations.dev: ease-out for entrances, ease-in-out for
// on-screen morphs. UI motion stays under 300ms.
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";
const MORPH_MS = 260;
const LIGHTBOX_MS = 280;

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// iOS Photos "Aspect Ratio Grid" icon: rectangle with outward corner arrows
function AspectIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M14 4h6v6" />
      <path d="M20 4l-5.5 5.5" />
      <path d="M10 20H4v-6" />
      <path d="M4 20l5.5-5.5" />
    </svg>
  );
}

// iOS Photos "Square Photo Grid" icon: square with inward corner arrows
function SquareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M9.5 4v5.5H4" />
      <path d="M9.5 9.5L4 4" />
      <path d="M14.5 20v-5.5H20" />
      <path d="M14.5 14.5L20 20" />
    </svg>
  );
}

function Tile({
  image,
  mode,
  sizes,
  onOpen,
  registerRef,
}: {
  image: GalleryImage;
  mode: ViewMode;
  sizes: string;
  onOpen: (el: HTMLElement) => void;
  registerRef: (el: HTMLElement | null) => void;
}) {
  const post = image.usedInPosts[0];

  return (
    <button
      ref={registerRef}
      onClick={(e) => onOpen(e.currentTarget)}
      className={`${mode === "original" ? "mb-0.5 break-inside-avoid" : ""} block w-full group relative cursor-zoom-in active:scale-[0.97] transition-transform duration-150`}
      style={{ transitionTimingFunction: EASE_OUT }}
      title={post?.title ?? image.filename}
    >
      {mode === "grid" ? (
        <div className="relative aspect-square overflow-hidden bg-paper-sunken dark:bg-night-raised">
          <Image
            src={image.path}
            alt={post?.title ?? image.filename}
            fill
            sizes={sizes}
            placeholder={image.meta ? "blur" : "empty"}
            blurDataURL={image.meta?.blurDataURL}
            className="object-cover"
          />
        </div>
      ) : (
        <Image
          src={image.path}
          alt={post?.title ?? image.filename}
          width={image.meta?.width ?? 800}
          height={image.meta?.height ?? 800}
          sizes={sizes}
          placeholder={image.meta ? "blur" : "empty"}
          blurDataURL={image.meta?.blurDataURL}
          className="w-full h-auto bg-paper-sunken dark:bg-night-raised"
        />
      )}
      {post && (
        <span className="absolute inset-x-0 bottom-0 px-2 py-1 text-[10px] text-left text-white bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150 truncate pointer-events-none">
          {post.title}
        </span>
      )}
    </button>
  );
}

function Lightbox({
  images,
  index,
  originRect,
  onClose,
  onNavigate,
}: {
  images: GalleryImage[];
  index: number;
  originRect: DOMRect | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const image = images[index];
  const post = image.usedInPosts[0];
  const backdropRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  // Shared-element entrance: zoom from the tile's on-screen rect.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const backdrop = backdropRef.current;
    if (!frame || !backdrop) return;

    if (reducedMotion() || !originRect) {
      backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 150,
        easing: "ease-out",
      });
      return;
    }

    const target = frame.getBoundingClientRect();
    const dx =
      originRect.left + originRect.width / 2 - (target.left + target.width / 2);
    const dy =
      originRect.top + originRect.height / 2 - (target.top + target.height / 2);
    const scale = Math.max(
      originRect.width / target.width,
      originRect.height / target.height
    );

    frame.animate(
      [
        {
          transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
          opacity: 0.4,
        },
        { transform: "none", opacity: 1 },
      ],
      { duration: LIGHTBOX_MS, easing: EASE_OUT }
    );
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: LIGHTBOX_MS,
      easing: EASE_OUT,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // entrance only

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const frame = frameRef.current;
    const backdrop = backdropRef.current;

    if (reducedMotion() || !originRect || !frame || !backdrop) {
      onClose();
      return;
    }

    const target = frame.getBoundingClientRect();
    const dx =
      originRect.left + originRect.width / 2 - (target.left + target.width / 2);
    const dy =
      originRect.top + originRect.height / 2 - (target.top + target.height / 2);
    const scale = Math.max(
      originRect.width / target.width,
      originRect.height / target.height
    );

    backdrop.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: LIGHTBOX_MS - 60,
      easing: EASE_OUT,
      fill: "forwards",
    });
    frame
      .animate(
        [
          { transform: "none", opacity: 1 },
          {
            transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
            opacity: 0,
          },
        ],
        { duration: LIGHTBOX_MS - 60, easing: EASE_OUT, fill: "forwards" }
      )
      .finished.then(onClose)
      .catch(onClose);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      // Keyboard navigation swaps instantly — never animate keyboard actions
      if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
      if (e.key === "ArrowRight" && index < images.length - 1)
        onNavigate(index + 1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, images.length]);

  return (
    <div className="fixed inset-0 z-50 cursor-zoom-out" onClick={close}>
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/90 backdrop-blur-xs"
      />
      <div className="relative h-full flex flex-col">
        <div ref={frameRef} className="relative flex-1 m-4 mb-2">
          <Image
            src={image.path}
            alt={post?.title ?? image.filename}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>
        <div
          className="flex items-center justify-center gap-3 pb-5 text-xs text-white/70"
          onClick={(e) => e.stopPropagation()}
        >
          {post && (
            <Link
              href={`/posts/${post.slug}`}
              className="underline underline-offset-2 hover:text-white transition-colors"
            >
              {post.title}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Gallery({ images }: GalleryProps) {
  const [mode, setMode] = useState<ViewMode>("grid");
  const [step, setStep] = useState(DEFAULT_STEP);
  const [selected, setSelected] = useState<{
    index: number;
    origin: DOMRect | null;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef(new Map<number, HTMLElement>());
  // First-rects captured just before a layout change, consumed by the FLIP pass
  const pendingFlip = useRef<Map<number, DOMRect> | null>(null);

  const cols = COLUMN_STEPS[step];
  const sizes = `${Math.ceil(100 / cols)}vw`;

  // Capture on-screen tile rects (presentation values — mid-animation rects
  // included, so an interrupting pinch continues from where things are).
  const captureRects = () => {
    if (reducedMotion()) return;
    const margin = 400;
    const rects = new Map<number, DOMRect>();
    tileRefs.current.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.bottom > -margin && r.top < window.innerHeight + margin) {
        rects.set(i, r);
      }
    });
    pendingFlip.current = rects;
  };

  const changeStep = (dir: 1 | -1) => {
    setStep((s) => {
      const next = Math.min(Math.max(s + dir, 0), COLUMN_STEPS.length - 1);
      if (next !== s) captureRects();
      return next;
    });
  };

  const toggleMode = () => {
    captureRects();
    setMode((m) => (m === "grid" ? "original" : "grid"));
  };

  // FLIP: after the new layout commits, morph tiles from old to new rects
  useLayoutEffect(() => {
    const first = pendingFlip.current;
    pendingFlip.current = null;
    if (!first) return;

    first.forEach((oldRect, i) => {
      const el = tileRefs.current.get(i);
      if (!el) return;
      el.getAnimations().forEach((a) => a.cancel());
      const last = el.getBoundingClientRect();
      const dx = oldRect.left - last.left;
      const dy = oldRect.top - last.top;
      const sx = oldRect.width / last.width;
      const sy = oldRect.height / last.height;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01)
        return;

      el.style.transformOrigin = "0 0";
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
          { transform: "none" },
        ],
        { duration: MORPH_MS, easing: EASE_IN_OUT }
      );
    });
  }, [cols, mode]);

  // Land at the bottom (newest photos), like opening the iOS library
  useEffect(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight });
  }, []);

  // Pinch to zoom: trackpad pinch arrives as ctrl+wheel, touch pinch as
  // two-pointer distance change. Both accumulate into discrete step moves.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let wheelAccum = 0;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return; // plain scroll passes through
      e.preventDefault();
      wheelAccum += e.deltaY;
      if (wheelAccum <= -60) {
        changeStep(-1); // zoom in
        wheelAccum = 0;
      } else if (wheelAccum >= 60) {
        changeStep(1); // zoom out
        wheelAccum = 0;
      }
    };

    let pinchStart = 0;
    const touchDist = (e: TouchEvent) => {
      const [a, b] = [e.touches[0], e.touches[1]];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) pinchStart = touchDist(e);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinchStart === 0) return;
      e.preventDefault();
      const ratio = touchDist(e) / pinchStart;
      if (ratio > 1.3) {
        changeStep(-1);
        pinchStart = touchDist(e);
      } else if (ratio < 0.77) {
        changeStep(1);
        pinchStart = touchDist(e);
      }
    };
    const onTouchEnd = () => {
      pinchStart = 0;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
    // handlers only touch refs/setState — safe to bind once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openLightbox = (index: number, el: HTMLElement) => {
    setSelected({ index, origin: el.getBoundingClientRect() });
  };

  const gridBody =
    mode === "grid" ? (
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {images.map((image, i) => (
          <Tile
            key={image.path}
            image={image}
            mode="grid"
            sizes={sizes}
            onOpen={(el) => openLightbox(i, el)}
            registerRef={(el) =>
              el ? tileRefs.current.set(i, el) : tileRefs.current.delete(i)
            }
          />
        ))}
      </div>
    ) : (
      <div style={{ columnCount: cols, columnGap: "2px" }}>
        {images.map((image, i) => (
          <Tile
            key={image.path}
            image={image}
            mode="original"
            sizes={sizes}
            onOpen={(el) => openLightbox(i, el)}
            registerRef={(el) =>
              el ? tileRefs.current.set(i, el) : tileRefs.current.delete(i)
            }
          />
        ))}
      </div>
    );

  return (
    <div ref={containerRef} className="min-h-screen px-1 sm:px-2">
      {/* Mode toggle: top-left so the site-wide theme switch (top-right) stays clear */}
      <div className="sticky top-0 z-10 flex justify-start px-2 py-2 pointer-events-none">
        <button
          onClick={toggleMode}
          className="pointer-events-auto p-2 rounded-full bg-paper/80 dark:bg-night/80 backdrop-blur-xs text-ink/60 dark:text-chalk/60 hover:text-ink dark:hover:text-chalk active:scale-95 transition-[color,transform] duration-150"
          aria-label={
            mode === "grid"
              ? "Switch to aspect ratio grid"
              : "Switch to square grid"
          }
          title={mode === "grid" ? "aspect ratio grid" : "square grid"}
        >
          {mode === "grid" ? <AspectIcon /> : <SquareIcon />}
        </button>
      </div>

      {gridBody}

      <p className="text-center text-[10px] text-ink/30 dark:text-chalk/30 py-6">
        {images.length} photos · pinch to zoom
      </p>

      {selected !== null && (
        <Lightbox
          images={images}
          index={selected.index}
          originRect={selected.origin}
          onClose={() => setSelected(null)}
          onNavigate={(index) =>
            setSelected((cur) => (cur ? { ...cur, index } : cur))
          }
        />
      )}
    </div>
  );
}
