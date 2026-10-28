import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPhotostream } from "@/utils/content/photostream";
import { blurBackground, photoAlt, photoTitle } from "@/utils/photoCaption";
import { FadeImage } from "@/components/photos/FadeImage";
import { PhotoMeta } from "@/components/photos/PhotoMeta";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const photo = (await getPhotostream()).find((item) => item.id === id);
  return {
    title: `${photo ? (photoTitle(photo) ?? photoAlt(photo).replace(/^Photo in /, "")) : "Photo"} — Benedict Neo`,
    description: photo?.description ?? (photo ? photoAlt(photo) : undefined),
    alternates: {
      canonical: `https://photos.bneo.xyz/photos/photo/${encodeURIComponent(id)}`,
    },
  };
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
      <div
        className="ph-view-image"
        // The blurred preview sits behind the image while it fades in.
        style={blurBackground(photo.blurDataURL)}
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
            href={`/photos/photo/${encodeURIComponent(previous.id)}`}
            className="ph-prev"
            aria-label="Previous photo"
          >
            <ArrowLeft size={20} />
          </Link>
        )}
        {next && (
          <Link
            href={`/photos/photo/${encodeURIComponent(next.id)}`}
            className="ph-next"
            aria-label="Next photo"
          >
            <ArrowRight size={20} />
          </Link>
        )}
      </div>
      <footer>
        <PhotoMeta photo={photo} />
      </footer>
    </main>
  );
}
