'use client';

import { useState } from 'react';
import Image from 'next/image';

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
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const navigateImage = () => {
    const newIndex = (currentIndex + 1) % imageList.length;
    setCurrentIndex(newIndex);
    setCurrentImage(imageList[newIndex]);
  };

  return (
    <div className="grid grid-cols-1 min-h-screen select-none">
      <div className="relative max-w-3xl mx-auto px-1 sm:px-4">
        <div className="p-1 sm:p-8">
          {/* Simple text prompt */}
          <div className="text-center mb-2">
            <span className="text-xs italic text-gray-400 tracking-wide">
              click to view my sketches
            </span>
          </div>
          <div className="relative">
            <div className="bg-white rounded-lg shadow-lg">
              <div
                className="overflow-hidden rounded-md cursor-pointer hover:scale-[0.99] transition-transform"
                onClick={navigateImage}
              >
                <Image
                  src={currentImage}
                  alt="Sequential artwork"
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: '100%', height: 'auto' }}
                  priority={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
