"use client";

import { useState, type CSSProperties } from "react";
import type { StreamPhoto } from "@/types/photostream";
import { exposureLine, frameNumber, shortCamera } from "@/utils/photoCamera";
import { placeLine } from "@/utils/photoPlaces";
import { FadeImage } from "./FadeImage";
import { PhotoLightbox } from "./PhotoLightbox";

type Props = {
  photos: StreamPhoto[];
  mode?: "sheet" | "essay";
  // Index of photos[0] in the list the lightbox pages through.
  offset?: number;
  onOpen: (index: number) => void;
  className?: string;
};

export function ContactSheet({
  photos,
  mode = "sheet",
  offset = 0,
  onOpen,
  className = "",
}: Props) {
  if (mode === "essay")
    return (
      <div className="ph-essay">
        {photos.map((photo, index) => (
          <figure
            key={photo.id}
            style={{ "--ar": photo.width / photo.height } as CSSProperties}
          >
            <button
              className="ph-frame"
              aria-label={`Open photo: ${photo.caption}`}
              onClick={() => onOpen(offset + index)}
            >
              <FadeImage
                src={photo.src}
                alt={photo.caption}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 1000px) 100vw, 1000px"
                quality={75}
                preload={index === 0}
                placeholder={photo.blurDataURL ? "blur" : "empty"}
                blurDataURL={photo.blurDataURL}
              />
            </button>
            <figcaption>
              <span>{photo.caption}</span>
              <span className="ph-mono">
                {[placeLine(photo.place) ?? photo.location, exposureLine(photo)]
                  .filter(Boolean)
                  .join("  ·  ")}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    );
  return (
    <div className={`ph-sheet ${className}`}>
      {photos.map((photo, index) => {
        const ratio = photo.width / photo.height;
        return (
          <figure
            key={photo.id}
            style={{ "--ar": ratio } as CSSProperties}
            className="ph-cell"
          >
            <button
              className="ph-frame"
              aria-label={`Open photo: ${photo.caption}`}
              onClick={() => onOpen(offset + index)}
            >
              <FadeImage
                src={photo.src}
                alt={photo.caption}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 700px) 60vw, 400px"
                quality={65}
                preload={offset + index < 3}
                placeholder={photo.blurDataURL ? "blur" : "empty"}
                blurDataURL={photo.blurDataURL}
              />
            </button>
            <figcaption className="ph-edge">
              <span>
                {[frameNumber(offset + index + 1), shortCamera(photo.camera)]
                  .filter(Boolean)
                  .join("  ")}
              </span>
              {/* Exposure prints in on hover so narrow frames stay legible. */}
              <span className="ph-edge-exposure">
                {exposureLine({ ...photo, focalLength: undefined })}
              </span>
            </figcaption>
          </figure>
        );
      })}
      <i className="ph-spacer" aria-hidden />
    </div>
  );
}

// A sheet with its own lightbox, for pages that show a single list.
export function PhotoGallery({
  photos,
  mode,
  className,
}: Pick<Props, "photos" | "mode" | "className">) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <>
      <ContactSheet
        photos={photos}
        mode={mode}
        className={className}
        onOpen={setSelected}
      />
      <PhotoLightbox photos={photos} index={selected} onIndex={setSelected} />
    </>
  );
}
