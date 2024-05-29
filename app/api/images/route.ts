import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const imagesDirectory = path.join(process.cwd(), 'public', 'images');

  console.log('imagesDirectory', imagesDirectory);

  const filenames = fs.readdirSync(imagesDirectory);

  console.log('filenames', filenames);

  const images = filenames.filter((name) =>
    /\.(jpg|jpeg|png|gif|webp)$/.test(name)
  );

  return NextResponse.json({ images });
}
