"use client";

import Image from "next/image";
import { X } from "lucide-react";

export type PostImage = { name: string; url: string };

export function ImageStrip({
  slug,
  images,
  onClose,
  onDelete,
}: {
  slug: string;
  images: PostImage[];
  onClose: () => void;
  onDelete: (fileName: string) => void;
}) {
  return (
    <div className="border-b border-rule dark:border-night-rule px-6 py-3 bg-paper dark:bg-night-raised/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-ink-soft dark:text-chalk-muted uppercase tracking-wider">
          Images ({images.length})
        </span>
        <button
          onClick={onClose}
          className="text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {images.map((img) => {
          // url comes from the API, which knows whether the file is staged in
          // drafts or already in R2 — the post's own state doesn't say.
          return (
            <div key={img.name} className="shrink-0 group relative">
              <Image
                src={img.url}
                alt={img.name}
                width={80}
                height={80}
                className="h-20 w-20 object-cover rounded-sm border border-rule dark:border-night-rule"
              />
              <button
                onClick={() => onDelete(img.name)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
              >
                <X size={12} />
              </button>
              <div className="text-[10px] text-ink-soft dark:text-chalk-muted mt-1 truncate w-20">
                {img.name.replace(`${slug}-`, "")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
