"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { StreamPhoto } from "@/types/photostream";
import { frameNumber } from "@/utils/photoCamera";
import { photoAlt } from "@/utils/photoCaption";
import { PhotoMeta } from "./PhotoMeta";

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
  // Horizontal swipe on touch; a second finger (pinch) cancels it.
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const swipe = useRef(true);
  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType !== "touch") return;
    if (touches.current.size === 0) swipe.current = true;
    else swipe.current = false;
    touches.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
  };
  const onPointerUp = (event: React.PointerEvent) => {
    const start = touches.current.get(event.pointerId);
    touches.current.delete(event.pointerId);
    if (!start || !swipe.current || touches.current.size > 0) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) {
      step(dx < 0 ? 1 : -1);
    }
  };
  const onPointerCancel = (event: React.PointerEvent) => {
    touches.current.delete(event.pointerId);
  };
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
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
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
              className="ph-prev"
              aria-label="Previous photo"
              disabled={index === 0}
              onClick={() => step(-1)}
            >
              <ArrowLeft size={20} />
            </button>
            <button
              className="ph-next"
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
