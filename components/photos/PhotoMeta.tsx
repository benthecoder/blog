import Link from "next/link";
import type { StreamPhoto } from "@/types/photostream";
import { exposureLine, shortCamera } from "@/utils/photoCamera";
import { formatPhotoDate } from "@/utils/photoDate";
import { parsePlace, placeSlug } from "@/utils/photoPlaces";

// The one caption bar under a photo, shared by the viewer and the photo page.
export function PhotoMeta({
  photo,
  pageLink = false,
}: {
  photo: StreamPhoto;
  pageLink?: boolean;
}) {
  const place = parsePlace(photo.place);
  const country = place?.country && placeSlug(place.country);
  const camera = [shortCamera(photo.camera), exposureLine(photo)]
    .filter(Boolean)
    .join(" · ");
  const date = formatPhotoDate(photo.date);
  return (
    <div className="ph-meta">
      <div>
        <p className="ph-meta-caption">{photo.caption}</p>
        <p className="ph-mono">
          {place ? (
            <>
              {place.spot && `${place.spot} · `}
              {place.city && (
                <Link
                  href={`/photos/places/${country}#${placeSlug(place.city)}`}
                >
                  {place.city}
                </Link>
              )}
              {place.city && " · "}
              <Link href={`/photos/places/${country}`}>{place.country}</Link>
            </>
          ) : (
            photo.location
          )}
          {date && (place || photo.location ? ` · ${date}` : date)}
        </p>
      </div>
      <div className="ph-meta-right">
        {camera && <p className="ph-mono">{camera}</p>}
        <p className="ph-mono ph-meta-links">
          {pageLink && (
            <Link href={`/photos/photo/${encodeURIComponent(photo.id)}`}>
              Photo page ↗
            </Link>
          )}
          {photo.journal && (
            <a
              href={`https://bneo.xyz/posts/${encodeURIComponent(photo.journal)}`}
            >
              Journal ↗
            </a>
          )}
        </p>
      </div>
    </div>
  );
}
