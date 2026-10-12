"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, Info, X } from "lucide-react";
import type { StreamPhoto } from "@/types/photostream";
import { formatPhotoDate } from "@/utils/photoDate";
import Link from "next/link";
import { PhotoDetails } from "./PhotoDetails";

export function PhotoGrid({
  photos,
  mode,
}: {
  photos: StreamPhoto[];
  mode: "rail" | "grid" | "essay";
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [limit, setLimit] = useState(36);
  const dialog = useRef<HTMLDialogElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const isOpen = selected !== null;
  const photo = selected === null ? null : photos[selected];

  useEffect(() => {
    if (!isOpen) return;
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (photos.length === 0) return null;
  const visible = mode === "rail" ? photos : photos.slice(0, limit);
  return (
    <>
      {mode === "rail" && (
        <div className="photo-rail-controls" aria-label="Scroll recent photos">
          <button
            aria-label="Scroll photos left"
            onClick={() =>
              rail.current?.scrollBy({
                left: -rail.current.clientWidth * 0.8,
                behavior: "smooth",
              })
            }
          >
            <ArrowLeft size={16} />
          </button>
          <button
            aria-label="Scroll photos right"
            onClick={() =>
              rail.current?.scrollBy({
                left: rail.current.clientWidth * 0.8,
                behavior: "smooth",
              })
            }
          >
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      <div className={`photo-${mode}`} ref={rail}>
        {visible.map((item, index) => (
          <figure key={item.id} className="photo-figure">
            <button
              className="photo-open"
              aria-label={`Open photo: ${item.caption}`}
              onClick={() => setSelected(index)}
            >
              <Image
                src={item.src}
                alt={item.caption}
                width={item.width}
                height={item.height}
                sizes={
                  mode === "rail"
                    ? "(max-width: 640px) 80vw, 420px"
                    : mode === "essay"
                      ? "(max-width: 800px) 100vw, 1000px"
                      : "(max-width: 600px) 50vw, (max-width: 1100px) 50vw, 34vw"
                }
                quality={mode === "essay" ? 75 : 65}
                preload={index < (mode === "grid" ? 3 : 1)}
                placeholder={item.blurDataURL ? "blur" : "empty"}
                blurDataURL={item.blurDataURL}
              />
              {mode === "grid" && (
                <span className="photo-hover-caption">{item.caption}</span>
              )}
            </button>
            {mode === "essay" && (
              <figcaption>
                <span>{item.caption}</span>
                <span>{item.location ?? formatPhotoDate(item.date)}</span>
              </figcaption>
            )}
          </figure>
        ))}
      </div>
      {mode !== "rail" && limit < photos.length && (
        <button
          className="photo-load-more"
          onClick={() => setLimit((count) => count + 36)}
        >
          More moments <ArrowRight size={16} />
        </button>
      )}
      <dialog
        ref={dialog}
        className="photo-lightbox"
        aria-label="Photo viewer"
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}
        onKeyDown={(event) => {
          if (selected === null) return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            event.stopPropagation();
            setSelected(
              Math.max(
                0,
                Math.min(
                  photos.length - 1,
                  selected + (event.key === "ArrowRight" ? 1 : -1)
                )
              )
            );
          }
        }}
      >
        {photo && (
          <div className="photo-lightbox-inner">
            <header className="photo-lightbox-heading">
              <span>
                {selected! + 1} / {photos.length}
              </span>
              <div className="photo-lightbox-actions">
                <details className="photo-viewer-details" key={photo.id}>
                  <summary aria-label="Photo details" title="Photo details">
                    <Info size={19} />
                  </summary>
                  <div className="photo-viewer-panel">
                    <PhotoDetails photo={photo} />
                    <Link
                      href={`/photos/photo/${encodeURIComponent(photo.id)}`}
                    >
                      Open photo page <ArrowUpRight size={13} />
                    </Link>
                    {photo.journal && (
                      <a
                        href={`https://bneo.xyz/posts/${encodeURIComponent(photo.journal)}`}
                      >
                        Read the journal <ArrowUpRight size={13} />
                      </a>
                    )}
                  </div>
                </details>
                <button
                  aria-label="Close photo"
                  onClick={() => setSelected(null)}
                  autoFocus
                >
                  <X size={22} />
                </button>
              </div>
            </header>
            <div className="photo-lightbox-image">
              <Image
                key={photo.id}
                src={photo.src}
                alt={photo.caption}
                fill
                sizes="100vw"
                quality={75}
              />
            </div>
            <div className="photo-lightbox-bottom">
              <button
                aria-label="Previous photo"
                disabled={selected === 0}
                onClick={() => setSelected((index) => index! - 1)}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="photo-lightbox-caption">
                <p>{photo.caption}</p>
                <p className="photo-camera">
                  {[photo.location, photo.camera].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                aria-label="Next photo"
                disabled={selected === photos.length - 1}
                onClick={() => setSelected((index) => index! + 1)}
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
