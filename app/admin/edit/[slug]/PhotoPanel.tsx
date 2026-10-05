"use client";

import { useEffect, useState } from "react";
import { ImageOff, Loader2, Plus, X } from "lucide-react";

type Photo = { id: string; name: string; time: string };

const fileUrl = (id: string, size: "thumb" | "full") =>
  `/api/admin/photos/file?id=${encodeURIComponent(id)}&size=${size}`;

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
 * every tile can render at once; clicking one hands a large JPEG to the
 * existing crop/name/upload flow.
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
  const [picking, setPicking] = useState<string | null>(null);

  // Reset-and-load on date change: a fetch keyed to the prop is effect-driven.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setPhotos([]);

    (async () => {
      try {
        const res = await fetch(
          `/api/admin/photos?date=${encodeURIComponent(date)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { status: typeof status; photos: Photo[] } =
          await res.json();
        if (cancelled) return;
        setStatus(data.status);
        setPhotos(data.photos);
      } catch (err) {
        if (!cancelled) setError(`Couldn't load photos (${err})`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [date]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handlePick = async (photo: Photo) => {
    if (picking) return;
    setPicking(photo.id);
    try {
      const res = await fetch(fileUrl(photo.id, "full"));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const name = slugifyName(photo.name);
      onPick(new File([blob], `${name}.jpg`, { type: "image/jpeg" }), name);
    } catch (err) {
      setError(`Couldn't fetch photo (${err})`);
    } finally {
      setPicking(null);
    }
  };

  const empty = !loading && !error && (status !== "ok" || photos.length === 0);

  return (
    <aside
      style={{ height: "calc(100vh - 4rem)" }}
      className="w-80 shrink-0 flex flex-col border-r border-rule dark:border-night-rule"
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
          className="p-1.5 rounded-xs text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk hover:bg-paper dark:hover:bg-night-raised transition-[color,background-color,transform] active:scale-90"
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
          <p className="text-xs text-red-600 dark:text-red-500 mb-2">{error}</p>
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

        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => handlePick(photo)}
              disabled={picking !== null}
              className="text-left group disabled:cursor-wait focus:outline-none"
              title={photo.name}
              aria-label={`Insert ${photo.name}, taken ${photo.time}`}
            >
              <div className="aspect-square rounded-sm outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ink dark:group-focus-visible:outline-chalk bg-paper-sunken dark:bg-night-raised overflow-hidden relative transition-[scale] duration-150 ease-out group-active:scale-[0.96]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrl(photo.id, "thumb")}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-xs px-1.5 py-0.5 text-[10px] bg-ink text-paper dark:bg-chalk dark:text-night opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150">
                  <Plus size={10} aria-hidden />
                  Insert
                </span>
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
              <div className="text-[11px] tabular-nums text-ink-soft dark:text-chalk-muted mt-1">
                {photo.time}
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
