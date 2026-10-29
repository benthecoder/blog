import type { Metadata } from "next";
import { PhotoStream } from "@/components/photos/PhotoStream";
import { getPhotostream } from "@/utils/content/photostream";
import { photoShareMetadata } from "@/utils/photoShare";

export async function generateMetadata(): Promise<Metadata> {
  const photos = await getPhotostream();
  return photoShareMetadata({
    title: "photos",
    description: "Every photo, by month.",
    path: "",
    photo: photos[0],
  });
}

// The stream changes only when photos are uploaded; serve it from the
// edge cache and refresh in the background.
export const revalidate = 60;

export default async function PhotosPage() {
  const photos = await getPhotostream();
  return (
    <PhotoStream
      photos={photos}
      header={<h1 className="ph-sr">All photos</h1>}
    />
  );
}
