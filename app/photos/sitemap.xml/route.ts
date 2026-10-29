import { getPhotosets, getPhotostream } from "@/utils/content/photostream";
import { photoSitemapUrls } from "@/utils/photoSitemap";
import { buildUrlset } from "@/utils/urlset";

export const revalidate = 3600;

// Served as photos.bneo.xyz/sitemap.xml (see rewrites in next.config.ts).
export async function GET() {
  try {
    const [photos, sets] = await Promise.all([
      getPhotostream(),
      getPhotosets(),
    ]);
    const xml = buildUrlset(
      photoSitemapUrls(
        photos,
        sets.map((set) => set.slug)
      )
    );
    return new Response(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch {
    return new Response(null, {
      status: 500,
      statusText: "Internal Server Error",
      headers: { "Content-Type": "text/plain" },
    });
  }
}
