"use client";

import { ContactSheet } from "@/components/photos/ContactSheet";
import { PhotoLightbox } from "@/components/photos/PhotoLightbox";
import { useLightboxHistory } from "@/components/photos/useLightboxHistory";
import type { StreamPhoto } from "@/types/photostream";

export function PhotoExample({ photos }: { photos: StreamPhoto[] }) {
  const [index, onIndex] = useLightboxHistory(photos);
  return (
    <>
      <ContactSheet photos={photos} onOpen={onIndex} />
      <PhotoLightbox photos={photos} index={index} onIndex={onIndex} />
    </>
  );
}
