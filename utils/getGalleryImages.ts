import fs from "fs";
import path from "path";
import sizeOf from "image-size";
import { IMAGES_DIR, POSTS_DIR } from "@/config/paths";
import { scanMarkdownDir } from "./markdown";

export interface GalleryImage {
  filename: string;
  path: string;
  usedInPosts: { slug: string; title: string }[];
  width: number;
  height: number;
  aspectRatio: number;
}

export function getGalleryImages(): GalleryImage[] {
  const imageFiles = fs
    .readdirSync(IMAGES_DIR)
    .filter((file) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
    .sort();

  const imageToPostsMap = new Map<string, { slug: string; title: string }[]>();

  scanMarkdownDir(POSTS_DIR).forEach(({ slug, data, content }) => {
    const imageRegex = /\/images\/([^)\s]+)/g;
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      const imageName = match[1];
      if (!imageToPostsMap.has(imageName)) {
        imageToPostsMap.set(imageName, []);
      }
      imageToPostsMap.get(imageName)!.push({
        slug,
        title: (data.title as string) || slug,
      });
    }
  });

  return imageFiles.map((filename) => {
    const imagePath = path.join(IMAGES_DIR, filename);
    let width = 1;
    let height = 1;

    try {
      const buffer = fs.readFileSync(imagePath);
      const dimensions = sizeOf(new Uint8Array(buffer));
      width = dimensions.width || 1;
      height = dimensions.height || 1;
    } catch (error) {
      console.error(`Failed to get dimensions for ${filename}:`, error);
    }

    return {
      filename,
      path: `/images/${filename}`,
      usedInPosts: imageToPostsMap.get(filename) || [],
      width,
      height,
      aspectRatio: width / height,
    };
  });
}
