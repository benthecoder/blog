import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Get images at build time instead of runtime
const getImageList = () => {
  try {
    const imagesDirectory = path.join(process.cwd(), 'public/images');
    return fs
      .readdirSync(imagesDirectory)
      .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map((file) => `/images/${file}`);
  } catch (error) {
    console.error('Error reading images directory:', error);
    return [];
  }
};

// Generate the list once at build/init time
const imageList = getImageList();

export async function GET() {
  try {
    // Randomly select a subset of images (e.g., 10 images)
    const shuffled = [...imageList].sort(() => 0.5 - Math.random());
    const selectedImages = shuffled.slice(0, 10);

    return NextResponse.json({ images: selectedImages });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
