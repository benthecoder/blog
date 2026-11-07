"use client";

import { useEffect, useRef, useState } from "react";
import { animateIn } from "@/components/admin/enterAnimation";
import { photoFileUrl } from "@/utils/photoTransfer";
import { ImageCropper } from "./ImageCropper";
import type { CropRect } from "./ImageCropper";
import { ViewerButton } from "./ViewerButton";

/** A photo from the Photos app (fetched at full size) or a local file. */
export type ViewerPhoto = {
  key: string;
  /** The default image name. */
  name: string;
  source: { id: string } | { file: File };
};

const EXIT_MS = 110;

/**
 * The large photo viewer. It opens in view mode: browse with the arrows,
 * Enter inserts the photo as it is, Esc leaves. C (or "crop") switches the
 * same view to crop mode, where Esc steps back to view mode first.
 * Opened from a tray tile it grows out of that tile.
 */
export function PhotoViewer({
  photos,
  start = 0,
  origin,
  onIndexChange,
  onInsert,
  onClose,
}: {
  photos: ViewerPhoto[];
  start?: number;
  /** The tile it opened from, in viewport coordinates. */
  origin: DOMRect | null;
  onIndexChange?: (index: number) => void;
  /** The owner closes the viewer once the photo is handed over. */
  onInsert: (
    file: File,
    name: string,
    crop: CropRect | null,
    rotation: number
  ) => Promise<boolean | undefined> | boolean | void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const [index, setIndex] = useState(start);
  const [mode, setMode] = useState<"view" | "crop">("view");
  const [names, setNames] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<{
    key: string;
    file: File;
    url: string;
  } | null>(null);

  const photo = photos[index];
  const name = names[photo.key] ?? photo.name;
  const ready = loaded?.key === photo.key ? loaded : null;
  const placeholder =
    "id" in photo.source ? photoFileUrl(photo.source.id, "thumb") : "";

  useEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    if (!dialog || !panel) return;
    // The dialog is unmounted with its content, so give focus back by hand.
    const opener = document.activeElement;
    dialog.showModal();
    // Keys act on the viewer itself, not on whichever button is first.
    dialog.focus();
    const box = panel.getBoundingClientRect();
    animateIn(panel, {
      from: origin ? 0.5 : 0.96,
      duration: 180,
      origin: origin
        ? `${origin.left + origin.width / 2 - box.left}px ${origin.top + origin.height / 2 - box.top}px`
        : "50% 50%",
    });
    dialog.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 160,
      easing: "ease-out",
    });
    return () => {
      dialog.close();
      if (opener instanceof HTMLElement) opener.focus();
    };
    // Only the first placement matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The large version of the current photo. The thumbnail shows meanwhile.
  useEffect(() => {
    const controller = new AbortController();
    let url: string | undefined;
    const { key, source } = photo;
    const load =
      "file" in source
        ? Promise.resolve(source.file)
        : fetch(photoFileUrl(source.id, "full"), {
            signal: controller.signal,
          }).then(async (res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return new File([await res.blob()], `${photo.name}.jpg`, {
              type: "image/jpeg",
            });
          });
    load
      .then((file) => {
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(file);
        setLoaded({ key, file, url });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(key);
      });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
    // The key identifies the photo; the rest of it is derived from the key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo.key]);

  // Warm the neighbours so browsing is instant.
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    for (const next of [photos[index - 1], photos[index + 1]]) {
      if (next && "id" in next.source)
        void fetch(photoFileUrl(next.source.id, "full"), {
          signal: controller.signal,
        }).catch(() => {});
    }
    return () => controller.abort();
    // Only once the current photo is in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready?.key]);

  /** A short exit, then the owner unmounts us. */
  const close = () => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    if (closing.current) return;
    closing.current = true;
    if (!dialog || !panel) return onClose();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const timing = {
      duration: EXIT_MS,
      easing: "ease-out",
      fill: "forwards",
    } as const;
    panel.animate(
      [
        { opacity: 1, transform: "none" },
        { opacity: 0, transform: reduced ? "none" : "scale(0.96)" },
      ],
      timing
    );
    void dialog
      .animate([{ opacity: 1 }, { opacity: 0 }], timing)
      .finished.catch(() => {})
      .then(onClose);
  };

  const go = (to: number) => {
    const next = Math.max(0, Math.min(photos.length - 1, to));
    if (next === index) return;
    setIndex(next);
    onIndexChange?.(next);
  };

  const insert = async () => {
    if (!ready || closing.current) return;
    closing.current = true;
    const ok = await onInsert(ready.file, name, null, 0);
    // A refused insert leaves the viewer open.
    if (ok === false) closing.current = false;
  };

  const confirmCrop = async (
    file: File,
    crop: CropRect | null,
    rotation: number
  ) => {
    closing.current = true;
    const ok = await onInsert(file, name, crop, rotation);
    if (ok === false) closing.current = false;
    return ok === false ? false : true;
  };

  const back = () => (mode === "crop" ? setMode("view") : close());

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      // Prevented here as well as in onCancel: a second Esc without any
      // click in between would otherwise close the dialog natively.
      event.preventDefault();
      event.stopPropagation();
      back();
      return;
    }
    if (mode !== "view" || event.metaKey || event.ctrlKey || event.altKey)
      return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      go(index + (event.key === "ArrowLeft" ? -1 : 1));
    } else if (event.key === "c" || event.key === "C") {
      event.preventDefault();
      if (ready) setMode("crop");
    } else if (
      event.key === "Enter" &&
      !(event.target instanceof HTMLButtonElement)
    ) {
      event.preventDefault();
      void insert();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-label="Photo viewer"
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none items-center justify-center overflow-hidden border-0 bg-night/90 p-0 text-chalk-strong outline-hidden backdrop:bg-transparent open:flex"
      onKeyDown={onKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        back();
      }}
      onClose={() => {
        // Closed natively despite the above: don't leave a dead viewer mounted.
        // (Dev strict mode closes and reopens it once; that is not this.)
        if (!closing.current && !dialogRef.current?.open) close();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) back();
      }}
    >
      <div ref={panelRef}>
        {mode === "crop" && ready ? (
          <ImageCropper
            // A different photo is a fresh cropper.
            key={ready.key}
            file={ready.file}
            fallbackSrc={ready.url}
            name={name}
            onNameChange={(value) =>
              setNames((all) => ({ ...all, [photo.key]: value }))
            }
            onConfirm={confirmCrop}
            onBack={() => setMode("view")}
          />
        ) : (
          <>
            <div className="relative h-[78dvh] w-[92vw]">
              {placeholder && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={placeholder}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain"
                />
              )}
              {ready && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={ready.key}
                  src={ready.url}
                  alt={photo.name}
                  className="absolute inset-0 h-full w-full object-contain transition-opacity duration-150 starting:opacity-0"
                />
              )}
            </div>
            <div className="mt-3 flex h-18 flex-col items-center justify-center gap-1">
              {failed === photo.key && (
                <p role="alert" className="text-xs text-chalk-strong">
                  Couldn’t load this photo.
                </p>
              )}
              <div className="flex items-center justify-center">
                {photos.length > 1 && (
                  <>
                    <ViewerButton
                      aria-label="Previous photo"
                      disabled={index === 0}
                      onClick={() => go(index - 1)}
                    >
                      ←
                    </ViewerButton>
                    <span
                      className="px-1 text-sm tabular-nums text-chalk"
                      aria-live="polite"
                    >
                      {index + 1} / {photos.length}
                    </span>
                    <ViewerButton
                      aria-label="Next photo"
                      disabled={index === photos.length - 1}
                      onClick={() => go(index + 1)}
                    >
                      →
                    </ViewerButton>
                  </>
                )}
                <ViewerButton disabled={!ready} onClick={() => setMode("crop")}>
                  crop (c)
                </ViewerButton>
                <ViewerButton disabled={!ready} onClick={() => void insert()}>
                  insert (⏎)
                </ViewerButton>
                <ViewerButton onClick={close}>back (esc)</ViewerButton>
              </div>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
