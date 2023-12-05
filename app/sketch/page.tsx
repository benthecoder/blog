'use client';

import { useState } from 'react';
import Image from 'next/image';

function Sketches() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const imageList: string[] = [
    '/images/room.png',
    '/images/wave.png',
    '/images/angel.png',
    '/images/howl.png',
  ];
  const openModal = (imageSrc: string) => {
    setSelectedImage(imageSrc);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <div>
      <div className='columns-1 md:columns-2 space-y-1 space-x-0 rounded-md'>
        {imageList.map((imageSrc, index) => (
          <div
            key={index}
            className='break-inside-avoid mb-0 cursor-crosshair'
            onClick={() => openModal(imageSrc)}
          >
            <Image
              src={imageSrc}
              alt={`Sketch ${index + 1}`}
              width={1000}
              height={200}
            />
          </div>
        ))}
      </div>

      {selectedImage && (
        <div
          className='fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50'
          onClick={closeModal}
        >
          <div className='bg-white p-4 max-h-full overflow-auto'>
            <Image
              src={selectedImage}
              alt='Selected Sketch'
              layout='fill'
              objectFit='contain'
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Sketches;
