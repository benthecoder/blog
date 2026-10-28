"use client";

import type { CSSProperties } from "react";
import type { StreamPhoto } from "@/types/photostream";
import { photoAlt } from "@/utils/photoCaption";
import { exposureLine, frameNumber, shortCamera } from "@/utils/photoCamera";
import { FadeImage } from "./FadeImage";

type Props = {
  photos: StreamPhoto[];
  // Index of photos[0] in the list the lightbox pages through.
  offset?: number;
  onOpen: (index: number) => void;
};

export function ContactSheet({ photos, offset = 0, onOpen }: Props) {
  return (
    <div className="ph-sheet">
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
              aria-label={`Open photo: ${photoAlt(photo)}`}
              onClick={() => onOpen(offset + index)}
            >
              <FadeImage
                src={photo.src}
                alt={photoAlt(photo)}
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
