import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { getPhotostream } from "@/utils/content/photostream";
import { PhotoDetails } from "@/components/photos/PhotoDetails";

type Props = { params: Promise<{ id: string }> };
export function generateStaticParams() {
  return getPhotostream().map(({ id }) => ({ id }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const photo = getPhotostream().find((item) => item.id === id);
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
  const photos = getPhotostream();
  const index = photos.findIndex((photo) => photo.id === id);
  if (index === -1) notFound();
  const photo = photos[index];
  const previous = photos[index - 1];
  const next = photos[index + 1];
  return (
    <main className="photo-single-page">
      <Link href="/photos/stream" className="photo-back">
        <ArrowLeft size={16} /> Photostream
      </Link>
      <Image
        src={photo.src}
        alt={photo.caption}
        width={photo.width}
        height={photo.height}
        sizes="(max-width: 800px) 100vw, 1000px"
        quality={75}
        preload
      />
      <div className="photo-single-caption">
        <h1>{photo.caption}</h1>
        <PhotoDetails photo={photo} />
        {photo.journal && (
          <a
            href={`https://bneo.xyz/posts/${encodeURIComponent(photo.journal)}`}
            className="photo-back"
          >
            Read the journal <ArrowUpRight size={14} />
          </a>
        )}
        <nav className="photo-single-navigation" aria-label="Adjacent photos">
          {previous ? (
            <Link href={`/photos/photo/${encodeURIComponent(previous.id)}`}>
              <ArrowLeft size={16} /> Previous
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/photos/photo/${encodeURIComponent(next.id)}`}>
              Next <ArrowRight size={16} />
            </Link>
          )}
        </nav>
      </div>
    </main>
  );
}
