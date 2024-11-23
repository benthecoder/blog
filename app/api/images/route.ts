import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  // Get the absolute path to the public/images directory
  const imagesDirectory = path.join(process.cwd(), 'public/images');

  // Read the directory
  const imageFiles = fs
    .readdirSync(imagesDirectory)
    // Filter for image files only
    .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
    // Add the /images prefix to each file
    .map((file) => `/images/${file}`);

  return NextResponse.json({ images: imageFiles });
}
