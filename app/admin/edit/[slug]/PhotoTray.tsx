"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ImageOff } from "lucide-react";
import type { CropRect } from "./ImageCropper";

import { PHOTO_TRANSFER_TYPE, photoFileUrl } from "@/utils/photoTransfer";

const PhotoViewer = dynamic(() =>
  import("./PhotoViewer").then((m) => m.PhotoViewer)
);

type Photo = { id: string; name: string; time: string };

const COLUMNS = 3;

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

const statusCls = "text-xs text-center text-muted";
const ease = "ease-[cubic-bezier(0.23,1,0.32,1)]";

/**
 * The day's photos from the Photos app. It loads when the draft opens, so
 * opening it is instant. Arrows move; a click, Space or Enter opens the
 * viewer, where the photo is cropped, renamed and inserted. A photo already
 * in the post carries a quiet "used" mark.
 */
export function PhotoTray({
  open,
  date,
  images,
  onInsert,
}: {
  open: boolean;
  /** YYYY-MM-DD, when the Photos helper can list the day. */
  date: string | null;
  /** Images the post's text already embeds. */
  images: { url: string; name: string }[];
  onInsert: (
    file: File,
    name: string,
    crop?: CropRect | null,
    rotation?: number
  ) => void;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [status, setStatus] = useState<"ok" | "not-built" | "denied">("ok");
  const [loading, setLoading] = useState(Boolean(date));
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState(0);
  const [viewer, setViewer] = useState<{
    index: number;
    origin: DOMRect | null;
  } | null>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);

  // Reset-and-load on date change: a fetch keyed to the prop is effect-driven.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setPhotos([]);
    // Fire and forget: failures land in the error state below.
    void (async () => {
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
          setError(`Couldn't load photos (${String(err)})`);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [date, reload]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Inserted images are named "<prefix>-<photo name>.jpg" unless renamed.
  const isUsed = (photo: Photo) => {
    const suffix = `-${slugifyName(photo.name)}.jpg`;
    return images.some((image) => image.name.endsWith(suffix));
  };
  const current = Math.min(selected, photos.length - 1);

  // Opening puts the keyboard on the selected tile.
  useEffect(() => {
    if (open) tiles.current[current]?.focus({ preventScroll: true });
    // Only on open; moving is handled by the key handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Opens at once: the viewer loads the large version itself.
  const view = (index: number) => {
    setSelected(index);
    setViewer({
      index,
      origin: tiles.current[index]?.getBoundingClientRect() ?? null,
    });
  };
  const closeViewer = () => {
    if (!viewer) return;
    // The viewer may have browsed away from the tile it opened on.
    const tile = viewer.index;
    setViewer(null);
    setSelected(tile);
    requestAnimationFrame(() => tiles.current[tile]?.focus());
  };

  const move = (to: number) => {
    const next = Math.max(0, Math.min(photos.length - 1, to));
    setSelected(next);
    tiles.current[next]?.focus();
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (!photos[current]) return;
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -COLUMNS,
      ArrowDown: COLUMNS,
    };
    if (event.key in steps) {
      event.preventDefault();
      move(current + steps[event.key]);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      view(current);
    }
  };

  const empty = !loading && !error && photos.length === 0;

  return (
    <aside
      aria-label="Photos"
      inert={!open}
      className={`fixed bottom-0 right-0 z-30 h-[70dvh] w-full lg:inset-y-0 lg:h-dvh lg:w-80 flex flex-col bg-surface max-lg:shadow-lg ${ease} motion-reduce:translate-x-0! motion-reduce:translate-y-0! ${
        open
          ? "opacity-100 translate-x-0 translate-y-0 transition-[opacity,translate] duration-200"
          : "invisible opacity-0 lg:translate-x-4 max-lg:translate-y-4 transition-[opacity,translate,visibility] duration-140"
      }`}
    >
      <div className="h-14 shrink-0 px-4 flex items-center text-xs text-muted lowercase">
        {date ? formatDay(date) : "photos"}
      </div>

      <div
        className={`flex-1 overflow-y-auto px-4 pb-4 admin-scrollbar ${empty ? "flex flex-col items-center justify-center gap-2" : ""}`}
        onKeyDown={onKeyDown}
      >
        {loading && photos.length === 0 && (
          <div className="grid grid-cols-3 gap-1.5" aria-busy="true">
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
            <p className="text-danger">{error}</p>
            {!loading && photos.length === 0 && (
              <button
                type="button"
                onClick={() => setReload((value) => value + 1)}
                className="min-h-11 underline underline-offset-2 text-accent focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                try again
              </button>
            )}
          </div>
        )}
        {empty && (
          <>
            <ImageOff size={20} className="text-muted" aria-hidden />
            {date && status === "not-built" ? (
              <p className={statusCls}>
                Run <code>pnpm photos:build</code> once to compile the Photos
                helper.
              </p>
            ) : date && status === "denied" ? (
              <p className={statusCls}>
                Give your terminal (the one running <code>pnpm dev</code>)
                Photos access: System Settings → Privacy &amp; Security →
                Photos.
              </p>
            ) : (
              <p className={statusCls}>
                {date
                  ? "No photos on this day."
                  : "No date to list photos for."}
              </p>
            )}
          </>
        )}

        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative aspect-square">
              <button
                type="button"
                ref={(node) => {
                  tiles.current[index] = node;
                }}
                tabIndex={index === current ? 0 : -1}
                onFocus={() => setSelected(index)}
                onClick={() => view(index)}
                draggable
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
                aria-label={`${photo.name}, taken ${photo.time}${isUsed(photo) ? ", used in this post" : ""}`}
                className={`block h-full w-full overflow-hidden rounded-sm bg-paper-sunken dark:bg-night-raised transition-[scale] duration-100 ease-out motion-safe:active:scale-[0.97] focus-visible:outline-none ${index === current ? "outline-2 outline-accent" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoFileUrl(photo.id, "thumb")}
                  alt=""
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              </button>
              {isUsed(photo) && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-1 left-1 rounded-xs bg-surface/80 px-1 text-2xs lowercase text-muted"
                >
                  used
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      {viewer && (
        <PhotoViewer
          photos={photos.map((photo) => ({
            key: photo.id,
            name: slugifyName(photo.name),
            source: { id: photo.id },
          }))}
          start={viewer.index}
          origin={viewer.origin}
          onIndexChange={(index) => setViewer((v) => v && { ...v, index })}
          onInsert={(file, name, crop, rotation) => {
            onInsert(file, name, crop, rotation);
            closeViewer();
            return true;
          }}
          onClose={closeViewer}
        />
      )}
    </aside>
  );
}
