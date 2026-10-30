import { getPhotostream } from "@/utils/content/photostream";
import { buildPhotoFeed } from "@/utils/content/photoFeed";

export const revalidate = 3600;

export async function GET() {
  try {
    const rss = buildPhotoFeed(await getPhotostream());
    return new Response(rss, {
      headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
    });
  } catch {
    return new Response(null, {
      status: 500,
      statusText: "Internal Server Error",
      headers: { "Content-Type": "text/plain" },
    });
  }
}
