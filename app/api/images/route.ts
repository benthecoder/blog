import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MAX_SIZE_MB = 250; // Set a safe limit below 300MB

export async function GET() {
  // Get the absolute path to the public/images directory
  const imagesDirectory = path.join(process.cwd(), 'public/images');

  try {
    // Read the directory
    const imageFiles = fs
      .readdirSync(imagesDirectory)
      // Filter for image files only
      .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      // Filter by file size
      .filter((file) => {
        const stats = fs.statSync(path.join(imagesDirectory, file));
        const fileSizeInMB = stats.size / (1024 * 1024); // Convert to MB
        return fileSizeInMB <= MAX_SIZE_MB;
      })
      // Add the /images prefix to each file
      .map((file) => `/images/${file}`);

    return NextResponse.json({ images: imageFiles });
  } catch (error) {
    console.error('Error reading images directory:', error);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
