"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal, flushSync } from "react-dom";
import type { ImageMeta } from "@/utils/content/imageMeta";

// Instant film formats: the photo window in millimetres. All three are 62
// tall, so prints of any format sit level beside each other.
const FILMS = {
  mini: [46, 62],
  square: [62, 62],
  wide: [99, 62],
} as const;

/** The format a photo of this shape would be printed on. */
function filmFor(size: { width: number; height: number } | null) {
  if (!size) return FILMS.square;
  const ratio = size.width / size.height;
  // Cut-offs sit halfway (geometrically) between neighbouring formats.
  if (ratio < 0.86) return FILMS.mini;
  if (ratio > 1.26) return FILMS.wide;
  return FILMS.square;
}

// The name the photo carries from its print into the viewer and back.
const LIFT = "photo-lift";

function canLift() {
  return (
    "startViewTransition" in document &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function PostImage({
  src,
  alt,
  meta,
  priority = false,
  onCaption,
}: {
  src: string;
  alt: string;
  meta?: ImageMeta | null;
  priority?: boolean;
  /** Editor preview only: makes the strip writable. */
  onCaption?: (caption: string) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  // Shape of the photo, for loose prints. The manifest knows it up front;
  // drafts and freshly published images only learn it once they load.
  const [size, setSize] = useState(
    meta ? { width: meta.width, height: meta.height } : null
  );
  const [expanded, setExpanded] = useState(false);
  // Drives the enter transition: the overlay mounts hidden, then animates in
  // on the next frame. Setting the final state immediately would skip it.
  const [entered, setEntered] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const viewImgRef = useRef<HTMLImageElement>(null);
  // The viewer starts from the photo already on screen, so the lift can
  // begin at once, then swaps in the full picture when it has loaded.
  const [viewSrc, setViewSrc] = useState(src);
  const [width, height] = filmFor(size);

  // A cached image can finish loading before React attaches onLoad, which
  // would strand the fade at opacity-0 and leave a blank frame. Catch that
  // case on mount by asking the element whether it's already done.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  // Without a blur placeholder (drafts, unknown images), fall back to the
  // opacity fade so images never pop in abruptly.
  const fadeIn = !meta?.blurDataURL;

  const open = async () => {
    const plate = imgRef.current;
    const shown = plate?.currentSrc || src;
    setViewSrc(shown);
    if (!plate || !canLift()) {
      setExpanded(true);
      return;
    }
    // Decode first so the viewer's snapshot isn't blank. The photo is
    // already cached, so this resolves within a frame.
    const ready = new window.Image();
    ready.src = shown;
    await ready.decode().catch(() => {});
    plate.style.viewTransitionName = LIFT;
    document.startViewTransition(() => {
      plate.style.viewTransitionName = "";
      flushSync(() => {
        setEntered(true);
        setExpanded(true);
      });
    });
  };

  const close = useCallback(() => {
    const plate = imgRef.current;
    const shut = () => {
      setEntered(false);
      setExpanded(false);
    };
    if (plate && viewImgRef.current && canLift()) {
      const lift = document.startViewTransition(() => {
        flushSync(shut);
        plate.style.viewTransitionName = LIFT;
      });
      // A skipped transition rejects; clear the name either way.
      const clear = () => {
        plate.style.viewTransitionName = "";
      };
      lift.finished.then(clear, clear);
    } else {
      shut();
    }
    // Send focus back to the plate, or the page loses its place. Quietly:
    // closing with Esc would otherwise count as keyboard focus and ring the
    // print the reader was just looking at.
    triggerRef.current?.setAttribute("data-quiet", "");
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  // Once the viewer is open, trade the on-screen photo for the full one.
  useEffect(() => {
    if (!expanded || viewSrc === src) return;
    const full = new window.Image();
    full.src = src;
    let live = true;
    full
      .decode()
      .then(() => live && setViewSrc(src))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [expanded, viewSrc, src]);

  // A layout effect, so the dialog is open (or closed) inside the flushSync
  // of a view transition, before the browser snapshots the new state.
  useLayoutEffect(() => {
    if (!expanded) return;

    const dialog = dialogRef.current;
    dialog?.showModal();

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
      dialog?.close();
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      cancelAnimationFrame(raf);
    };
  }, [expanded]);

  return (
    <figure
      className="photo-print not-prose"
      style={
        {
          "--plate-ratio": `${width} / ${height}`,
          "--plate-ar": width / height,
        } as React.CSSProperties
      }
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        onBlur={(e) => e.currentTarget.removeAttribute("data-quiet")}
        aria-label={alt ? `Expand image: ${alt}` : "Expand image"}
        // The keyboard focus ring is drawn around the whole print; see
        // .photo-print in globals.css.
        className="photo-frame block w-full cursor-zoom-in border-0 outline-none"
      >
        <div className="photo-plate relative w-full overflow-hidden">
          <Image
            // Without this ref the mount check below never sees the image, so
            // a photo that loaded before hydration stayed invisible.
            ref={imgRef}
            src={src}
            alt={alt}
            fill
            // Lazy images can choose from their actual laid-out slot. Older
            // browsers retain the existing fallback; artwork stays untouched.
            // The flagged first image preloads instead (see markdownConfig).
            loading={priority ? "eager" : "lazy"}
            preload={priority || undefined}
            sizes="auto, (max-width: 800px) 100vw, 800px"
            placeholder={meta?.blurDataURL ? "blur" : "empty"}
            blurDataURL={meta?.blurDataURL}
            onLoad={(e) => {
              const { naturalWidth: width, naturalHeight: height } =
                e.currentTarget;
              // iOS Safari can fire load while the image still reports 0×0.
              // A 0/0 ratio is NaN, which invalidates the print's width and
              // shape rules and collapses it to a one-letter column.
              if (width > 0 && height > 0) {
                setSize((known) => known ?? { width, height });
              }
              setLoaded(true);
            }}
            className={`object-cover ${
              fadeIn
                ? `transition-opacity duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${loaded ? "opacity-100" : "opacity-0"}`
                : ""
            }`}
          />
        </div>
      </button>

      {onCaption ? (
        <figcaption className="photo-label">
          <input
            defaultValue={alt}
            placeholder="write a caption"
            aria-label="Caption"
            onBlur={(e) => {
              const caption = e.currentTarget.value.trim();
              if (caption !== alt) onCaption(caption);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        </figcaption>
      ) : (
        alt && <figcaption className="photo-label">{alt}</figcaption>
      )}

      {expanded &&
        createPortal(
          <dialog
            ref={dialogRef}
            aria-label={alt || "Expanded image"}
            onCancel={(event) => {
              event.preventDefault();
              close();
            }}
            onClick={close}
            className={`fixed inset-0 z-100 m-0 h-full max-h-none w-full max-w-none border-0 flex flex-col items-center justify-center gap-4 p-6 sm:p-12 cursor-zoom-out bg-night/90 backdrop:bg-transparent backdrop-blur-sm transition-opacity duration-200 ease-out motion-reduce:transition-none ${
              entered ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Portalled to <body>, so the film crop above doesn't reach it
                — this is the whole picture, uncropped. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={viewImgRef}
              src={viewSrc}
              alt={alt}
              style={{ viewTransitionName: LIFT }}
              onClick={(e) => e.stopPropagation()}
              className={`max-h-[85vh] max-w-full object-contain rounded-image cursor-default shadow-2xl transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
                entered ? "scale-100" : "scale-[0.97]"
              }`}
            />
            {alt && (
              // Not .photo-label: that resolves to the light-mode ink colour,
              // and this overlay is dark in both themes.
              <figcaption className="max-w-prose text-center text-caption lowercase tracking-[0.08em] text-chalk-soft">
                {alt}
              </figcaption>
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close expanded image"
              className="absolute top-5 right-5 min-h-11 min-w-11 touch-manipulation text-xs tracking-widest text-chalk-muted hover:text-chalk-strong transition-colors outline-none focus-visible:ring-2 focus-visible:ring-chalk/40 rounded-xs px-2 py-1"
            >
              esc
            </button>
          </dialog>,
          document.body
        )}
    </figure>
  );
}
