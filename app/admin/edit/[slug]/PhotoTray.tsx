"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ImageOff, Loader2, X } from "lucide-react";
import type { CropRect } from "./ImageCropper";

import { PHOTO_TRANSFER_TYPE, photoFileUrl } from "@/utils/photoTransfer";

const PhotoViewer = dynamic(() =>
  import("./PhotoViewer").then((m) => m.PhotoViewer)
);

type Photo = { id: string; name: string; time: string };
type Tile =
  | { kind: "post"; key: string; url: string; name: string }
  | { kind: "day"; key: string; photo: Photo };

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
 * The post's photos: images already in it first, then the day's photos from
 * the Photos app. It loads when the draft opens, so opening it is instant.
 * Arrows move, Enter inserts as is, Space (or a click) opens the viewer, and
 * Backspace removes an image from the post.
 */
export function PhotoTray({
  open,
  date,
  images,
  uploads,
  onRetry,
  onRemove,
  onInsert,
}: {
  open: boolean;
  /** YYYY-MM-DD, when the Photos helper can list the day. */
  date: string | null;
  images: { url: string; name: string }[];
  uploads: Record<string, "uploading" | "failed">;
  onRetry: (url: string) => void;
  /** Called once the tile has collapsed. */
  onRemove: (image: { url: string; name: string }) => void;
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
  const [picking, setPicking] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string[]>([]);
  const [viewer, setViewer] = useState<{
    index: number;
    origin: DOMRect | null;
  } | null>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const click = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pickRequest = useRef<AbortController | null>(null);

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
  useEffect(
    () => () => {
      clearTimeout(click.current);
      pickRequest.current?.abort();
    },
    []
  );

  const all: Tile[] = [
    ...images.map((image) => ({
      kind: "post" as const,
      key: image.url,
      url: image.url,
      name: image.name,
    })),
    ...photos.map((photo) => ({
      kind: "day" as const,
      key: photo.id,
      photo,
    })),
  ];
  const current = Math.min(selected, all.length - 1);

  // Opening puts the keyboard on the selected tile.
  useEffect(() => {
    if (open) tiles.current[current]?.focus({ preventScroll: true });
    // Only on open; moving is handled by the key handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchFull = async (photo: Photo) => {
    if (pickRequest.current) return null;
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
      if (controller.signal.aborted) return null;
      const name = slugifyName(photo.name);
      return {
        file: new File([blob], `${name}.jpg`, { type: "image/jpeg" }),
        name,
      };
    } catch (err) {
      if (!controller.signal.aborted)
        setError(`Couldn't fetch photo (${String(err)})`);
      return null;
    } finally {
      if (pickRequest.current === controller) {
        pickRequest.current = null;
        setPicking(null);
      }
    }
  };
  const insert = async (photo: Photo) => {
    const picked = await fetchFull(photo);
    if (picked) onInsert(picked.file, picked.name);
  };
  // Opens at once: the viewer loads the large version itself.
  const view = (photo: Photo, index: number) =>
    setViewer({
      index: photos.indexOf(photo),
      origin: tiles.current[index]?.getBoundingClientRect() ?? null,
    });
  const closeViewer = () => {
    if (!viewer) return;
    // The viewer may have browsed away from the tile it opened on.
    const tile = images.length + viewer.index;
    setViewer(null);
    setSelected(tile);
    requestAnimationFrame(() => tiles.current[tile]?.focus());
  };
  const remove = (image: { url: string; name: string }) => {
    if (leaving.includes(image.url)) return;
    setLeaving((list) => [...list, image.url]);
    // Let the tile collapse before the text and file follow.
    setTimeout(() => {
      setLeaving((list) => list.filter((url) => url !== image.url));
      onRemove(image);
    }, 160);
  };

  const move = (to: number) => {
    const next = Math.max(0, Math.min(all.length - 1, to));
    setSelected(next);
    tiles.current[next]?.focus();
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const tile = all[current];
    if (!tile) return;
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -COLUMNS,
      ArrowDown: COLUMNS,
    };
    if (event.key in steps) {
      event.preventDefault();
      move(current + steps[event.key]);
    } else if (tile.kind === "day" && event.key === "Enter") {
      event.preventDefault();
      void insert(tile.photo);
    } else if (tile.kind === "day" && event.key === " ") {
      event.preventDefault();
      view(tile.photo, current);
    } else if (
      tile.kind === "post" &&
      (event.key === "Backspace" || event.key === "Delete")
    ) {
      event.preventDefault();
      remove(tile);
      move(current > 0 ? current - 1 : 0);
    }
  };

  const empty = !loading && !error && all.length === 0;

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
        {loading && all.length === 0 && (
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
                {date ? "No photos on this day." : "No images in this post."}
              </p>
            )}
          </>
        )}

        <div className="grid grid-cols-3 gap-1.5">
          {all.map((tile, index) => {
            const upload = tile.kind === "post" ? uploads[tile.url] : undefined;
            const isLeaving =
              tile.kind === "post" && leaving.includes(tile.url);
            return (
              <div
                key={tile.key}
                className={`relative aspect-square transition-[opacity,scale] duration-160 ease-out ${isLeaving ? "opacity-0 scale-75 motion-reduce:scale-100" : ""}`}
              >
                <button
                  type="button"
                  ref={(node) => {
                    tiles.current[index] = node;
                  }}
                  tabIndex={index === current ? 0 : -1}
                  onFocus={() => setSelected(index)}
                  onClick={() => {
                    setSelected(index);
                    if (tile.kind !== "day") return;
                    clearTimeout(click.current);
                    // A second click inserts instead.
                    click.current = setTimeout(
                      () => view(tile.photo, index),
                      220
                    );
                  }}
                  onDoubleClick={() => {
                    if (tile.kind !== "day") return;
                    clearTimeout(click.current);
                    void insert(tile.photo);
                  }}
                  draggable={tile.kind === "day" && picking === null}
                  onDragStart={(event) => {
                    if (tile.kind !== "day") return;
                    event.dataTransfer.effectAllowed = "copy";
                    const payload = JSON.stringify({
                      kind: "blog-photo",
                      id: tile.photo.id,
                      name: tile.photo.name,
                    });
                    event.dataTransfer.setData(PHOTO_TRANSFER_TYPE, payload);
                    event.dataTransfer.setData("text/plain", payload);
                  }}
                  aria-label={
                    tile.kind === "day"
                      ? `${tile.photo.name}, taken ${tile.photo.time}`
                      : `${tile.name}, in this post`
                  }
                  className={`block h-full w-full overflow-hidden rounded-sm bg-paper-sunken dark:bg-night-raised transition-[scale] duration-100 ease-out motion-safe:active:scale-[0.97] focus-visible:outline-none ${index === current ? "outline-2 outline-accent" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    // Remount when an upload lands, so a 404 from before it is retried.
                    key={upload ?? "ready"}
                    src={
                      tile.kind === "day"
                        ? photoFileUrl(tile.photo.id, "thumb")
                        : tile.url
                    }
                    alt=""
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                  {tile.kind === "day" && picking === tile.photo.id && (
                    <span className="absolute inset-0 flex items-center justify-center bg-surface/60">
                      <Loader2
                        size={18}
                        className="motion-safe:animate-spin text-accent"
                        aria-hidden
                      />
                    </span>
                  )}
                </button>
                {tile.kind === "post" && (
                  <>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent"
                    />
                    <button
                      type="button"
                      onClick={() => remove(tile)}
                      aria-label={`Remove ${tile.name} from this post`}
                      className="focus-ring absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface/80 text-primary"
                    >
                      <X size={12} aria-hidden />
                    </button>
                    {upload === "uploading" && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-sm bg-surface/60">
                        <Loader2
                          size={18}
                          className="motion-safe:animate-spin text-accent"
                          aria-label="Uploading"
                        />
                      </span>
                    )}
                    {upload === "failed" && (
                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 rounded-b-sm bg-surface/90 px-1.5 py-0.5 text-2xs">
                        <span className="text-danger">failed</span>
                        <button
                          type="button"
                          onClick={() => onRetry(tile.url)}
                          className="focus-ring text-accent underline"
                        >
                          retry
                        </button>
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}
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
