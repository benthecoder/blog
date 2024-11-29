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

  const navigateImage = (direction: 'prev' | 'next') => {
    const newIndex =
      direction === 'next'
        ? (currentIndex + 1) % imageList.length
        : (currentIndex - 1 + imageList.length) % imageList.length;

    setCurrentIndex(newIndex);
    setCurrentImage(imageList[newIndex]); // Fixed: Use newIndex instead of currentIndex
  };

  return (
    <div className="grid grid-cols-1 min-h-screen">
      <div className="relative max-w-3xl mx-auto px-4">
        <div className="p-8">
          <div className="relative">
            {/* Rich mahogany frame with aged patina */}
            <div
              className="relative before:absolute before:inset-0 before:p-[20px] 
                          before:bg-gradient-to-tr before:from-[#2A1810] before:via-[#5C3D2E] before:to-[#2A1810]
                          before:-z-10"
            >
              <div className="overflow-hidden">
                {/* Deep wood grain pattern */}
                <div
                  className="border-[14px] border-[#4A3728] 
                            [background-image:repeating-linear-gradient(45deg,#382218_0,#382218_1px,transparent_0,transparent_50%)]
                            [background-size:10px_10px]"
                >
                  {/* Antique gold liner */}
                  <div
                    className="border-[3px] border-[#8B7355] p-[2px]
                              bg-gradient-to-tr from-[#8B7355] via-[#A38A65] to-[#8B7355]
                              rounded-sm"
                  >
                    <div className="rounded-[2px] overflow-hidden">
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

          {/* Navigation buttons remain the same */}
          <div className="flex justify-center items-center gap-8 mt-6">
            <button
              onClick={() => navigateImage('prev')}
              className="text-2xl hover:scale-110 transition-transform"
              aria-label="Previous image"
            >
              ◀️
            </button>
            <button
              onClick={() => navigateImage('next')}
              className="text-2xl hover:scale-110 transition-transform"
              aria-label="Next image"
            >
              ▶️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
