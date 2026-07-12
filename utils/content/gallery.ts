import { POSTS_DIR } from "@/config/paths";
import { scanMarkdownDir } from "./markdown";
import { getImageMeta, type ImageMeta } from "./imageMeta";
import { r2ListImages } from "@/utils/r2";

export interface GalleryImage {
  filename: string;
  path: string;
  usedInPosts: { slug: string; title: string; date: string }[];
  meta: ImageMeta | null;
}

// Published images live in R2; the gallery lists the bucket at build time.
// No dimensions needed: the grid view crops to squares and the original
// view lets the browser lay images out at natural aspect.
export async function getGalleryImages(): Promise<GalleryImage[]> {
  let filenames: string[];
  try {
    // Root-level images only (subdirs like uses/ and drawings/ are not gallery content)
    filenames = (await r2ListImages()).filter(
      (name) => !name.includes("/") && /\.(jpg|jpeg|png|gif|webp)$/i.test(name)
    );
  } catch (error) {
    console.warn("⚠️  Could not list R2 images, gallery will be empty:", error);
    return [];
  }

  const imageToPostsMap = new Map<
    string,
    { slug: string; title: string; date: string }[]
  >();

  scanMarkdownDir(POSTS_DIR).forEach(({ slug, data, content }) => {
    const imageRegex = /\/images\/([^)\s]+)/g;
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      const imageName = match[1];
      if (!imageToPostsMap.has(imageName)) imageToPostsMap.set(imageName, []);
      imageToPostsMap.get(imageName)!.push({
        slug,
        title: (data.title as string) || slug,
        date: (data.date as string) || "",
      });
    }
  });

  const images = filenames.map((filename) => ({
    filename,
    path: `/images/${filename}`,
    usedInPosts: imageToPostsMap.get(filename) || [],
    meta: getImageMeta(`/images/${filename}`),
  }));

  // Chronological like a photo library: oldest at the top, newest at the
  // bottom. Images not tied to a post sort first, alphabetically.
  const postTime = (img: (typeof images)[number]) => {
    const dates = img.usedInPosts
      .map((p) => new Date(p.date).getTime())
      .filter((t) => !Number.isNaN(t));
    return dates.length ? Math.min(...dates) : 0;
  };

  return images.sort((a, b) => {
    const ta = postTime(a);
    const tb = postTime(b);
    if (ta !== tb) return ta - tb;
    return a.filename.localeCompare(b.filename);
  });
}
