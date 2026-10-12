import type { Metadata } from "next";
import { PhotoStream } from "@/components/photos/PhotoStream";
import { getPhotostream } from "@/utils/content/photostream";

export const metadata: Metadata = {
  title: "photostream — Benedict Neo",
  alternates: { canonical: "https://photos.bneo.xyz/photos/stream" },
};

export default async function PhotostreamPage() {
  const photos = await getPhotostream();
  return <PhotoStream photos={photos} />;
}
