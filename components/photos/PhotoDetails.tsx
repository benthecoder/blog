import type { StreamPhoto } from "@/types/photostream";
import { formatPhotoDate } from "@/utils/photoDate";

export function PhotoDetails({ photo }: { photo: StreamPhoto }) {
  const settings = [
    photo.focalLength ? `${photo.focalLength}mm` : null,
    photo.aperture ? `ƒ/${photo.aperture}` : null,
    photo.shutter ? `${photo.shutter}s` : null,
    photo.iso ? `ISO ${photo.iso}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="photo-details">
      {photo.description && (
        <p className="photo-description">{photo.description}</p>
      )}
      <dl>
        {photo.camera && (
          <div>
            <dt>Camera</dt>
            <dd>{photo.camera}</dd>
          </div>
        )}
        {photo.lens && (
          <div>
            <dt>Lens</dt>
            <dd>{photo.lens}</dd>
          </div>
        )}
        {settings && (
          <div>
            <dt>Settings</dt>
            <dd>{settings}</dd>
          </div>
        )}
        {photo.location && (
          <div>
            <dt>Place</dt>
            <dd>{photo.location}</dd>
          </div>
        )}
        {photo.date && (
          <div>
            <dt>Date</dt>
            <dd>{formatPhotoDate(photo.date)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
