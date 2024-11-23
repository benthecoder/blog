'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';

const HomePage = () => {
  const [currentImage, setCurrentImage] = useState<string>(
    '/images/handrose.png'
  );
  const [imageList, setImageList] = useState<string[]>([]);

  useEffect(() => {
    // Fetch the list of images from the API
    const fetchImages = async () => {
      const response = await fetch('/api/images');
      const data = await response.json();
      setImageList(data.images);
    };

    fetchImages();
  }, []);

  const showRandomImage = () => {
    let nextImage = currentImage;
    // Keep generating until we get a different image
    while (nextImage === currentImage && imageList.length > 1) {
      nextImage = imageList[Math.floor(Math.random() * imageList.length)];
    }
    setCurrentImage(nextImage);
  };

  return (
    <div className="grid grid-cols-1">
      <div
        className="cursor-pointer hover:opacity-90 transition-opacity"
        onClick={showRandomImage}
      >
        <Image
          src={currentImage}
          alt="Random artwork"
          width={0}
          height={0}
          sizes="100vw"
          style={{ width: '100%', height: 'auto' }}
          priority={true}
        />
      </div>

      <Link href="/posts" className="underline mt-10">
        View the archives
      </Link>
    </div>
  );
};

export default HomePage;
