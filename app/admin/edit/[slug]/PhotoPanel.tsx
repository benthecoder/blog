"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type Photo = { id: string; name: string; time: string };

const fileUrl = (id: string, size: "thumb" | "full") =>
  `/api/admin/photos/file?id=${encodeURIComponent(id)}&size=${size}`;

/** "IMG_1234.HEIC" -> "img-1234", matching the drop handler's default name. */
const slugifyName = (filename: string) =>
  filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .toLowerCase();

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

  return (
    <aside
      style={{ height: "calc(100vh - 4rem)" }}
      className="w-80 shrink-0 flex flex-col border-r border-rule dark:border-night-rule"
    >
      <div className="border-b border-rule dark:border-night-rule px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-ink-soft dark:text-chalk-muted uppercase tracking-wider">
          Photos · {date}
          {photos.length > 0 && ` (${photos.length})`}
        </span>
        <button
          onClick={onClose}
          className="text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 admin-scrollbar">
        {loading && (
          <p className="text-xs text-ink-soft dark:text-chalk-muted">
            Loading photos…
          </p>
        )}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-500 mb-2">{error}</p>
        )}
        {!loading && status === "not-built" && (
          <p className="text-xs text-ink-soft dark:text-chalk-muted">
            Run <code>pnpm photos:build</code> once to compile the Photos
            helper.
          </p>
        )}
        {!loading && status === "denied" && (
          <p className="text-xs text-ink-soft dark:text-chalk-muted">
            Give your terminal (the one running <code>pnpm dev</code>) Photos
            access: System Settings → Privacy &amp; Security → Photos.
          </p>
        )}
        {!loading && status === "ok" && !error && photos.length === 0 && (
          <p className="text-xs text-ink-soft dark:text-chalk-muted">
            No photos on this day.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => handlePick(photo)}
              disabled={picking !== null}
              className="text-left group disabled:cursor-default"
              title={photo.name}
            >
              <div className="aspect-square rounded-sm border border-rule dark:border-night-rule bg-paper-sunken dark:bg-night-raised overflow-hidden flex items-center justify-center relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrl(photo.id, "thumb")}
                  alt={photo.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
                {picking === photo.id && (
                  <span className="absolute inset-0 flex items-center justify-center bg-paper/70 dark:bg-night/70 text-[10px] text-ink dark:text-chalk">
                    loading…
                  </span>
                )}
              </div>
              <div className="text-[10px] text-ink-soft dark:text-chalk-muted mt-1">
                {photo.time}
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
