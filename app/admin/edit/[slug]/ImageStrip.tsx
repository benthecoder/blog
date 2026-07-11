"use client";

import Image from "next/image";
import { X } from "lucide-react";

export function ImageStrip({
  slug,
  isDraft,
  images,
  onClose,
  onDelete,
}: {
  slug: string;
  isDraft: boolean;
  images: string[];
  onClose: () => void;
  onDelete: (fileName: string) => void;
}) {
  return (
    <div className="border-b border-japanese-shiraumenezu dark:border-gray-700 px-6 py-3 bg-japanese-kinairo dark:bg-gray-800/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-japanese-ginnezu dark:text-gray-500 uppercase tracking-wider">
          Images ({images.length})
        </span>
        <button
          onClick={onClose}
          className="text-japanese-ginnezu dark:text-gray-500 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {images.map((img) => {
          // Determine the correct path (drafts or published)
          const imgPath = isDraft ? `/images/drafts/${img}` : `/images/${img}`;
          return (
            <div key={img} className="shrink-0 group relative">
              <Image
                src={imgPath}
                alt={img}
                width={80}
                height={80}
                className="h-20 w-20 object-cover rounded-sm border border-japanese-shiraumenezu dark:border-gray-700"
              />
              <button
                onClick={() => onDelete(img)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
              >
                <X size={12} />
              </button>
              <div className="text-[10px] text-japanese-ginnezu dark:text-gray-500 mt-1 truncate w-20">
                {img.replace(`${slug}-`, "")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
