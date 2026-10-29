import type { Metadata } from "next";
import { SITE_URL } from "@/config/site";

// Matches the ImageResponse size in app/og/route.tsx.
export const OG_IMAGE_WIDTH = 1920;
export const OG_IMAGE_HEIGHT = 1080;

export function ogImageUrl(title: string): string {
  return `/og?title=${encodeURIComponent(title)}`;
}

type PageMetadataInput = {
  title: string;
  description?: string;
  path: string;
};

// Next merges openGraph shallowly, so a page that sets none inherits the root
// card. Every page therefore builds its own title, url and image here.
export function pageMetadata({
  title,
  description,
  path,
}: PageMetadataInput): Metadata {
  const image = ogImageUrl(title);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: "Benedict Neo",
      type: "website",
      images: [{ url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT }],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@benedictneo",
      title,
      description,
      images: [image],
    },
  };
}
