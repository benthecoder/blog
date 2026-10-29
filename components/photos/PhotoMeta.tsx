import Link from "next/link";
import type { StreamPhoto } from "@/types/photostream";
import { exposureLine, shortCamera } from "@/utils/photoCamera";
import { photoTitle } from "@/utils/photoCaption";
import { formatPhotoDate } from "@/utils/photoDate";
import { parsePlace, placeSlug } from "@/utils/photoPlaces";

// The one caption bar under a photo, shared by the viewer and the photo page.
export function PhotoMeta({ photo }: { photo: StreamPhoto }) {
  const place = parsePlace(photo.place);
  const country = place?.country && placeSlug(place.country);
  const camera = [shortCamera(photo.camera), exposureLine(photo)]
    .filter(Boolean)
    .join(" · ");
  const date = formatPhotoDate(photo.date);
  const title = photoTitle(photo);
  return (
    <div className="ph-meta">
      <div>
        {title && <p className="ph-meta-caption">{title}</p>}
        <p className="ph-mono">
          {place ? (
            <>
              {place.spot && `${place.spot} · `}
              {place.city && (
                <Link href={`/places/${country}/${placeSlug(place.city)}`}>
                  {place.city}
                </Link>
              )}
              {place.city && " · "}
              <Link href={`/places/${country}`}>{place.country}</Link>
            </>
          ) : (
            photo.location
          )}
          {date && (place || photo.location ? ` · ${date}` : date)}
        </p>
      </div>
      <div className="ph-meta-right">
        {camera && <p className="ph-mono">{camera}</p>}
        {photo.journal && (
          <p className="ph-mono ph-meta-links">
            <a
              href={`https://bneo.xyz/posts/${encodeURIComponent(photo.journal)}`}
            >
              Journal ↗
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
