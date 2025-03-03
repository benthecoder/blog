'use client';

import ChatInterface from '../components/ChatInterface';
import { useState, useEffect, useCallback } from 'react';

const HomePage = () => {
  const [backgroundImage, setBackgroundImage] = useState(
    '/images/sunflowersketch.png'
  );
  const imageList = [
    '/images/handrose.png',
    '/images/sunflowersketch.png',
    '/images/peony.png',
    '/images/hummingbird.png',
    '/images/howl.png',
    '/images/hokusai.png',
    '/images/christ.png',
    '/images/metro.png',
    '/images/wave.png',
    '/images/room.png',
    '/images/angel.png',
  ];

  const changeBackground = useCallback(() => {
    let randomIndex;
    let newImage;
    do {
      randomIndex = Math.floor(Math.random() * imageList.length);
      newImage = imageList[randomIndex];
    } while (newImage === backgroundImage && imageList.length > 1);

    setBackgroundImage(newImage);
  }, [backgroundImage, imageList]);

  // Just randomize background without showing gallery
  const toggleGallery = () => {
    // Instead of showing gallery, just change background
    changeBackground();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      changeBackground();
    }, 45000); // Change every 45 seconds

    return () => {
      clearInterval(interval);
    };
  }, [changeBackground]);

  return (
    <div className="grid grid-cols-1 min-h-screen">
      <div className="relative max-w-3xl mx-auto px-1 sm:px-4 w-full select-none">
        <div className="p-1 sm:p-8 select-none">
          {/* Chat Interface */}
          <ChatInterface
            backgroundImage={backgroundImage}
            onChangeBackgroundAction={toggleGallery}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
