import type { Metadata } from "next";
import { PHOTOS_URL } from "@/config/site";
import type { StreamPhoto } from "@/types/photostream";
import { photoAlt } from "./photoCaption";

const SHARE_WIDTH = 1200;

/** The photo as an absolute, optimizer-sized image for og:image. */
export function photoShareImage(photo: StreamPhoto) {
  return {
    url: `${PHOTOS_URL}/_next/image?url=${encodeURIComponent(photo.src)}&w=${SHARE_WIDTH}&q=75`,
    width: SHARE_WIDTH,
    height: Math.round((SHARE_WIDTH * photo.height) / photo.width),
    alt: photoAlt(photo),
  };
}

/** Canonical, Open Graph and Twitter metadata for a photos page. `path` is
 * the page's path on the photos host; `photo` is the preview image, if any. */
export function photoShareMetadata({
  title,
  description,
  path,
  photo,
  type = "website",
}: {
  title: string;
  description?: string;
  path: string;
  photo?: StreamPhoto;
  type?: "website" | "article";
}): Metadata {
  const url = `${PHOTOS_URL}${path}`;
  const image = photo && photoShareImage(photo);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Benedict Neo",
      type,
      ...(image && { images: [image] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image && { images: [image.url] }),
    },
  };
}
