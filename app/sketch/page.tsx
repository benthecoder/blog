"use client";

import { useState } from "react";
import Image from "next/image";

function Sketches() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const imageList: string[] = [
    "/images/handrose.png",
    "/images/sunflowersketch.png",
    "/images/peony.png",
    "/images/hummingbird.png",
    "/images/howl.png",
    "/images/hokusai.png",
    "/images/christ.png",
    "/images/metro.png",
    "/images/wave.png",
    "/images/room.png",
    "/images/angel.png",
  ];
  const openModal = (imageSrc: string) => {
    setSelectedImage(imageSrc);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <div>
      <h1 className="font-bold text-left mb-10 text-2xl"> Sketches</h1>
      <p className="mb-5">Drawn with reMarkable 2 </p>
      <div className="columns-1 md:columns-2 space-y-1 space-x-0 rounded-md">
        {imageList.map((imageSrc) => (
          <div
            key={imageSrc}
            className="break-inside-avoid mb-0 cursor-crosshair"
            onClick={() => openModal(imageSrc)}
          >
            <Image src={imageSrc} alt={imageSrc} width={1000} height={200} />
          </div>
        ))}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
          onClick={closeModal}
        >
          <div className="bg-white p-4 max-h-full overflow-auto">
            <Image
              src={selectedImage}
              alt="Selected Sketch"
              layout="fill"
              objectFit="contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Sketches;
