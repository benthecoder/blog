import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPhotostream } from "@/utils/content/photostream";
import { FadeImage } from "@/components/photos/FadeImage";
import { PhotoMeta } from "@/components/photos/PhotoMeta";
import { ArrowLeft, ArrowRight } from "lucide-react";

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const photo = (await getPhotostream()).find((item) => item.id === id);
  return {
    title: `${photo?.caption ?? "photo"} — Benedict Neo`,
    description: photo?.description ?? photo?.caption,
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
      <div className="ph-view-image">
        <FadeImage
          src={photo.src}
          alt={photo.caption}
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
