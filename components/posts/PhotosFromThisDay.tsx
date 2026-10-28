import Image from "next/image";
import { PHOTOS_URL } from "@/config/site";
import type { StreamPhoto } from "@/types/photostream";
import { photoAlt } from "@/utils/photoCaption";

const PhotosFromThisDay = ({ photos }: { photos: StreamPhoto[] }) => {
  if (photos.length === 0) return null;

  return (
    <div className="mt-8 text-xs">
      <p className="text-primary/60 mb-1">Photos from this day</p>
      <ul className="flex flex-wrap gap-1.5">
        {photos.map((photo) => {
          const alt = photoAlt(photo);
          return (
            <li key={photo.id}>
              <a
                href={`${PHOTOS_URL}/photos/photo/${encodeURIComponent(photo.id)}`}
                aria-label={alt}
                className="relative block size-16 overflow-hidden rounded-[calc(var(--radius-image)-2px)] opacity-90 transition-opacity hover:opacity-100"
              >
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                  placeholder={photo.blurDataURL ? "blur" : "empty"}
                  blurDataURL={photo.blurDataURL}
                />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PhotosFromThisDay;
