import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPhotostream } from "@/utils/content/photostream";
import { blurBackground, photoAlt, photoTitle } from "@/utils/photoCaption";
import { photoShareMetadata } from "@/utils/photoShare";
import { photoJsonLd } from "@/utils/photoJsonLd";
import { serializeJsonLd } from "@/utils/jsonLd";
import { FadeImage } from "@/components/photos/FadeImage";
import { PhotoStepper } from "@/components/photos/PhotoStepper";
import { PhotoMeta } from "@/components/photos/PhotoMeta";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const revalidate = 60;

const photoHref = (id: string) => `/photo/${encodeURIComponent(id)}`;

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const photo = (await getPhotostream()).find((item) => item.id === id);
  return photoShareMetadata({
    title: `${photo ? (photoTitle(photo) ?? photoAlt(photo).replace(/^Photo in /, "")) : "Photo"} — Benedict Neo`,
    description: photo?.description ?? (photo ? photoAlt(photo) : undefined),
    path: `/photo/${encodeURIComponent(id)}`,
    photo,
    type: "article",
  });
}
export default async function PhotoPage({ params }: Props) {
  const { id } = await params;
  const photos = await getPhotostream();
  const index = photos.findIndex((photo) => photo.id === id);
  if (index === -1) notFound();
  const photo = photos[index];
  const previous = photos[index - 1];
  const next = photos[index + 1];
  return (
    <main className="ph-view">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(photoJsonLd(photo)),
        }}
      />
      <PhotoStepper
        className="ph-view-image"
        // The blurred preview sits behind the image while it fades in.
        style={blurBackground(photo.blurDataURL)}
        previousHref={previous && photoHref(previous.id)}
        nextHref={next && photoHref(next.id)}
        previousSrc={previous?.src}
        nextSrc={next?.src}
      >
        <FadeImage
          src={photo.src}
          alt={photoAlt(photo)}
          fill
          sizes="100vw"
          quality={80}
          preload
        />
        {previous && (
          <Link
            href={photoHref(previous.id)}
            className="ph-prev"
            aria-label="Previous photo"
          >
            <ArrowLeft size={20} />
          </Link>
        )}
        {next && (
          <Link
            href={photoHref(next.id)}
            className="ph-next"
            aria-label="Next photo"
          >
            <ArrowRight size={20} />
          </Link>
        )}
      </PhotoStepper>
      <footer>
        <PhotoMeta photo={photo} />
      </footer>
    </main>
  );
}
