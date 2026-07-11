import { POSTS_DIR } from "@/config/paths";
import { scanMarkdownDir } from "./markdown";
import { readGalleryManifest } from "./galleryManifest";

export interface GalleryImage {
  filename: string;
  path: string;
  usedInPosts: { slug: string; title: string }[];
  width: number;
  height: number;
  aspectRatio: number;
}

// Published images live in R2, so filenames + dimensions come from the
// committed manifest instead of scanning public/images.
export function getGalleryImages(): GalleryImage[] {
  const imageToPostsMap = new Map<string, { slug: string; title: string }[]>();

  scanMarkdownDir(POSTS_DIR).forEach(({ slug, data, content }) => {
    const imageRegex = /\/images\/([^)\s]+)/g;
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      const imageName = match[1];
      if (!imageToPostsMap.has(imageName)) imageToPostsMap.set(imageName, []);
      imageToPostsMap
        .get(imageName)!
        .push({ slug, title: (data.title as string) || slug });
    }
  });

  return readGalleryManifest().map(({ filename, width, height }) => ({
    filename,
    path: `/images/${filename}`,
    usedInPosts: imageToPostsMap.get(filename) || [],
    width,
    height,
    aspectRatio: width / height,
  }));
}
