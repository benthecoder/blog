import fs from "fs";
import path from "path";
import matter from "gray-matter";
import sizeOf from "image-size";

export interface GalleryImage {
  filename: string;
  path: string;
  usedInPosts: { slug: string; title: string }[];
  width: number;
  height: number;
  aspectRatio: number;
}

export function getGalleryImages(): GalleryImage[] {
  const imagesDir = path.join(process.cwd(), "public/images");
  const postsDir = path.join(process.cwd(), "posts");

  // Get all images
  const imageFiles = fs
    .readdirSync(imagesDir)
    .filter((file) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
    .sort();

  // Create a map of image filename to posts that use it
  const imageToPostsMap = new Map<string, { slug: string; title: string }[]>();

  // Scan all posts for image references
  const postFiles = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith(".md"));

  postFiles.forEach((postFile) => {
    const slug = postFile.replace(".md", "");
    const postPath = path.join(postsDir, postFile);
    const fileContents = fs.readFileSync(postPath, "utf8");
    const { data, content } = matter(fileContents);

    // Find all image references in the markdown content
    const imageRegex = /\/images\/([^)\s]+)/g;
    let match;

    while ((match = imageRegex.exec(content)) !== null) {
      const imageName = match[1];

      if (!imageToPostsMap.has(imageName)) {
        imageToPostsMap.set(imageName, []);
      }

      imageToPostsMap.get(imageName)!.push({
        slug,
        title: data.title || slug,
      });
    }
  });

  // Combine images with their post references and dimensions
  return imageFiles.map((filename) => {
    const imagePath = path.join(imagesDir, filename);
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
