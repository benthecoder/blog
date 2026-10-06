"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, Loader2, X } from "lucide-react";

import { PHOTO_TRANSFER_TYPE, photoFileUrl } from "@/utils/photoTransfer";
import { PhotoPreview } from "./PhotoPreview";

type Photo = { id: string; name: string; time: string };

/** "IMG_1234.HEIC" -> "img-1234", matching the drop handler's default name. */
const slugifyName = (filename: string) =>
  filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .toLowerCase();

// Same human format as the editor footer ("Mar 5, 2026"); parsed as a local
// date so the day doesn't shift with the timezone.
const formatDay = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const statusCls = "text-xs text-center text-ink-soft dark:text-chalk-muted";

/**
 * Photos taken on the draft's date. The day fetch writes the thumbnails, so
 * every tile can render at once. Clicking previews; Insert hands a large JPEG
 * to the existing crop/name/upload flow.
 */
export function PhotoPanel({
  date,
  onPick,
  onClose,
}: {
  /** YYYY-MM-DD */
  date: string;
  onPick: (file: File, name: string) => void;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [status, setStatus] = useState<"ok" | "not-built" | "denied">("ok");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const pickRequest = useRef<AbortController | null>(null);

  // Reset-and-load on date change: a fetch keyed to the prop is effect-driven.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setPhotos([]);
    setPreviewId(null);
    setPicking(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/admin/photos?date=${encodeURIComponent(date)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { status: typeof status; photos: Photo[] } =
          await res.json();
        if (controller.signal.aborted) return;
        setStatus(data.status);
        setPhotos(data.photos);
      } catch (err) {
        if (!controller.signal.aborted)
          setError(`Couldn't load photos (${err})`);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      controller.abort();
      pickRequest.current?.abort();
      pickRequest.current = null;
    };
  }, [date, reload]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handlePick = async (photo: Photo) => {
    if (pickRequest.current) return;
    const controller = new AbortController();
    pickRequest.current = controller;
    setError("");
    setPicking(photo.id);
    try {
      const res = await fetch(photoFileUrl(photo.id, "full"), {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (controller.signal.aborted) return;
      const name = slugifyName(photo.name);
      setPreviewId(null);
      onPick(new File([blob], `${name}.jpg`, { type: "image/jpeg" }), name);
    } catch (err) {
      if (!controller.signal.aborted) setError(`Couldn't fetch photo (${err})`);
    } finally {
      if (pickRequest.current === controller) {
        pickRequest.current = null;
        setPicking(null);
      }
    }
  };

  const empty = !loading && !error && (status !== "ok" || photos.length === 0);

  return (
    <aside
      aria-label="Photos from this day"
      className="fixed bottom-0 right-0 z-30 h-[70dvh] w-full sm:w-80 lg:static lg:h-dvh lg:z-auto shrink-0 flex flex-col border-l border-t lg:border-t-0 border-rule dark:border-night-rule bg-paper dark:bg-night"
    >
      <div className="h-[55px] shrink-0 border-b border-rule dark:border-night-rule px-4 flex items-center justify-between">
        <span className="text-xs text-ink-soft dark:text-chalk-muted uppercase tracking-wider">
          Photos · {formatDay(date)}
          {photos.length > 0 && (
            <span className="ml-1.5 tabular-nums text-ink-muted dark:text-chalk-muted/70">
              {photos.length}
            </span>
          )}
        </span>
        <button
          onClick={onClose}
          className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xs text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk hover:bg-paper dark:hover:bg-night-raised transition-[color,background-color,transform] active:scale-90"
          title="Close"
          aria-label="Close photos"
        >
          <X size={18} />
        </button>
      </div>

      <div
        className={`flex-1 overflow-y-auto p-3 admin-scrollbar ${empty ? "flex flex-col items-center justify-center gap-2" : ""}`}
      >
        {loading && (
          <div className="grid grid-cols-2 gap-2" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="aspect-square rounded-sm bg-paper-sunken dark:bg-night-raised motion-safe:animate-pulse"
              />
            ))}
          </div>
        )}
        {error && (
          <div className="mb-2 text-xs" role="alert">
            <p className="text-red-600 dark:text-red-500">{error}</p>
            {!loading && photos.length === 0 && (
              <button
                type="button"
                onClick={() => setReload((value) => value + 1)}
                className="min-h-11 underline underline-offset-2 text-ink dark:text-chalk focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Try again
              </button>
            )}
          </div>
        )}
        {empty && (
          <>
            <ImageOff
              size={20}
              className="text-ink-muted dark:text-chalk-muted/70"
              aria-hidden
            />
            {status === "not-built" && (
              <p className={statusCls}>
                Run <code>pnpm photos:build</code> once to compile the Photos
                helper.
              </p>
            )}
            {status === "denied" && (
              <p className={statusCls}>
                Give your terminal (the one running <code>pnpm dev</code>)
                Photos access: System Settings → Privacy &amp; Security →
                Photos.
              </p>
            )}
            {status === "ok" && (
              <p className={statusCls}>No photos on this day.</p>
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="min-w-0">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setPreviewId(photo.id);
                }}
                draggable={picking === null}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "copy";
                  const payload = JSON.stringify({
                    kind: "blog-photo",
                    id: photo.id,
                    name: photo.name,
                  });
                  event.dataTransfer.setData(PHOTO_TRANSFER_TYPE, payload);
                  event.dataTransfer.setData("text/plain", payload);
                }}
                disabled={picking !== null}
                className="w-full text-left group disabled:cursor-wait focus-visible:outline-none"
                title="Preview or drag into the text"
                aria-label={`Preview ${photo.name}, taken ${photo.time}`}
              >
                <div className="aspect-square rounded-sm outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ink dark:group-focus-visible:outline-chalk bg-paper-sunken dark:bg-night-raised overflow-hidden relative transition-[scale] duration-150 ease-out motion-safe:group-active:scale-[0.96]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoFileUrl(photo.id, "thumb")}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="w-full h-full object-cover"
                  />
                  {picking === photo.id && (
                    <span className="absolute inset-0 flex items-center justify-center bg-paper/60 dark:bg-night/60">
                      <Loader2
                        size={18}
                        className="motion-safe:animate-spin text-ink dark:text-chalk"
                        aria-hidden
                      />
                    </span>
                  )}
                </div>
              </button>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] tabular-nums text-ink-soft dark:text-chalk-muted">
                  {photo.time}
                </span>
                <button
                  type="button"
                  onClick={() => handlePick(photo)}
                  disabled={picking !== null}
                  aria-label={`Insert ${photo.name}`}
                  className="min-h-11 min-w-11 px-1 text-xs text-ink dark:text-chalk hover:underline disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-ink dark:focus-visible:outline-chalk"
                >
                  Insert
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {previewId &&
        photos.some((photo) => photo.id === previewId) &&
        (() => {
          const index = photos.findIndex((photo) => photo.id === previewId);
          return (
            <PhotoPreview
              photo={photos[index]}
              busy={picking !== null}
              error={error}
              hasPrevious={index > 0}
              hasNext={index < photos.length - 1}
              onPrevious={() => {
                setError("");
                setPreviewId(photos[index - 1].id);
              }}
              onNext={() => {
                setError("");
                setPreviewId(photos[index + 1].id);
              }}
              onInsert={() => handlePick(photos[index])}
              onClose={() => {
                pickRequest.current?.abort();
                pickRequest.current = null;
                setPicking(null);
                setPreviewId(null);
              }}
            />
          );
        })()}
    </aside>
  );
}
