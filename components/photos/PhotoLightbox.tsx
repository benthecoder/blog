"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { StreamPhoto } from "@/types/photostream";
import { frameNumber } from "@/utils/photoCamera";
import { blurBackground, photoAlt } from "@/utils/photoCaption";
import { PhotoMeta } from "./PhotoMeta";
import { preloadPhoto } from "./preloadPhoto";
import { useSwipe } from "./useSwipe";

type Props = {
  photos: StreamPhoto[];
  index: number | null;
  onIndex: (index: number | null) => void;
};

export function PhotoLightbox({ photos, index, onIndex }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const isOpen = index !== null;
  const photo = index === null ? null : photos[index];

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

  const step = (delta: number) =>
    onIndex(Math.max(0, Math.min(photos.length - 1, index! + delta)));
  const swipe = useSwipe((direction) => step(direction));
  useEffect(() => {
    if (index === null) return;
    for (const near of [photos[index - 1], photos[index + 1]]) {
      if (near) preloadPhoto(near.src, 75);
    }
  }, [photos, index]);
  return (
    <dialog
      ref={dialog}
      className="ph-lightbox"
      aria-label="Photo viewer"
      onClose={() => onIndex(null)}
      onClick={(event) => {
        if (event.target === event.currentTarget) onIndex(null);
      }}
      onKeyDown={(event) => {
        if (index === null) return;
        if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
          return;
        }
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          event.stopPropagation();
          step(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      {photo && (
        <div className="ph-lightbox-inner">
          <header>
            <span className="ph-mono">
              {frameNumber(index! + 1)} / {frameNumber(photos.length)}
            </span>
            <button
              aria-label="Close photo"
              onClick={() => onIndex(null)}
              autoFocus
            >
              <X size={20} />
            </button>
          </header>
          <div
            className="ph-lightbox-image"
            style={blurBackground(photo.blurDataURL)}
            {...swipe}
          >
            <Image
              key={photo.id}
              src={photo.src}
              alt={photoAlt(photo)}
              fill
              sizes="100vw"
              quality={75}
            />
            <button
              className="focus-ring ph-prev"
              aria-label="Previous photo"
              disabled={index === 0}
              onClick={() => step(-1)}
            >
              <ArrowLeft size={20} />
            </button>
            <button
              className="focus-ring ph-next"
              aria-label="Next photo"
              disabled={index === photos.length - 1}
              onClick={() => step(1)}
            >
              <ArrowRight size={20} />
            </button>
          </div>
          <footer>
            <PhotoMeta photo={photo} />
          </footer>
        </div>
      )}
    </dialog>
  );
}
