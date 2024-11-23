'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const HomePage = () => {
  const imageList = [
    '/images/wave.png',
    '/images/handrose.png',
    '/images/sunflowersketch.png',
    '/images/peony.png',
    '/images/hummingbird.png',
    '/images/howl.png',
    '/images/hokusai.png',
    '/images/christ.png',
    '/images/metro.png',
    '/images/room.png',
    '/images/angel.png',
  ];

  const [currentImage, setCurrentImage] = useState<string>(imageList[0]);

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
    </div>
  );
};

export default HomePage;
