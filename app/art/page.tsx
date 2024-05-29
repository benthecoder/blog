'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const ImageBrowser = () => {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchImages = async () => {
      const response = await fetch('/api/images');
      const data = await response.json();
      setImages(data.images);
    };

    fetchImages();
  }, []);

  const handleClick = () => {
    setCurrentIndex(Math.floor(Math.random() * images.length));
  };

  if (images.length === 0) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <h1 className="font-bold text-left mb-10 text-2xl"> Art</h1>
      <div onClick={handleClick} className="cursor-pointer">
        <Image
          src={`/images/${images[currentIndex]}`}
          alt="Image Browser"
          width={800}
          height={600}
        />
      </div>
    </>
  );
};

export default ImageBrowser;
