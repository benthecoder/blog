"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import type { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

/** Largest centred crop of `aspect` that fits the image, in percent units. */
function centeredCrop(width: number, height: number, aspect?: number): Crop {
  if (!aspect) return { unit: "%", x: 0, y: 0, width: 100, height: 100 };
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 100 }, aspect, width, height),
    width,
    height
  );
}

/** A crop rectangle in the source image's own pixels. */
export type CropRect = { x: number; y: number; width: number; height: number };

/**
 * Converts the on-screen selection into source-image pixels.
 *
 * The crop is sent to the server rather than rendered here on a canvas: the
 * upload route already re-encodes to JPEG, so cropping in the browser meant
 * encoding twice and visibly softening the result. sharp cuts from the
 * untouched original instead, leaving exactly one lossy step.
 */
function toSourceRect(image: HTMLImageElement, crop: PixelCrop): CropRect {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const x = Math.max(0, Math.round(crop.x * scaleX));
  const y = Math.max(0, Math.round(crop.y * scaleY));
  return {
    x,
    y,
    // Clamp so rounding can never ask for a pixel past the edge.
    width: Math.min(Math.round(crop.width * scaleX), image.naturalWidth - x),
    height: Math.min(Math.round(crop.height * scaleY), image.naturalHeight - y),
  };
}

export function ImageCropModal({
  file,
  name,
  onNameChange,
  onConfirm,
  onCancel,
  uploading,
}: {
  file: File;
  name: string;
  onNameChange: (value: string) => void;
  onConfirm: (file: File, crop: CropRect | null) => void;
  onCancel: () => void;
  uploading: boolean;
}) {
  const [src, setSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completed, setCompleted] = useState<PixelCrop>();
  // Square by default: post images render as square plates, so this is the
  // framing that will actually be shown.
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [busy, setBusy] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centeredCrop(width, height, aspect));
    },
    [aspect]
  );

  const changeAspect = (next: number | undefined) => {
    setAspect(next);
    const img = imgRef.current;
    if (img) setCrop(centeredCrop(img.width, img.height, next));
  };

  const confirm = () => {
    const img = imgRef.current;
    if (!img || !completed?.width || !completed?.height) return;
    const rect = toSourceRect(img, completed);
    // A selection covering the whole frame needs no extract step at all.
    const full =
      rect.x === 0 &&
      rect.y === 0 &&
      rect.width === img.naturalWidth &&
      rect.height === img.naturalHeight;
    setBusy(true);
    onConfirm(file, full ? null : rect);
  };

  const disabled = busy || uploading;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !disabled) onCancel();
      }}
    >
      <div className="bg-paper dark:bg-night border border-rule dark:border-night-rule p-6 w-full max-w-2xl max-h-full overflow-y-auto admin-scrollbar rounded-xs">
        <h2 className="text-lg font-light mb-4 text-ink dark:text-chalk tracking-wide">
          Crop image
        </h2>

        <div className="flex items-center justify-center bg-paper-sunken dark:bg-night-raised rounded-xs p-2 mb-4">
          {src && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompleted(c)}
              aspect={aspect}
              keepSelection
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={src}
                alt="Crop preview"
                onLoad={onImageLoad}
                style={{ maxHeight: "55vh", width: "auto" }}
              />
            </ReactCrop>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(
            [
              ["square", 1],
              ["4:3", 4 / 3],
              ["3:4", 3 / 4],
              ["free", undefined],
            ] as const
          ).map(([label, value]) => (
            <button
              key={label}
              onClick={() => changeAspect(value)}
              className={`px-2.5 py-1 text-xs rounded-xs border transition-colors ${
                aspect === value
                  ? "border-ink dark:border-chalk text-ink dark:text-chalk"
                  : "border-rule dark:border-night-rule text-ink-muted dark:text-chalk-muted hover:text-ink dark:hover:text-chalk"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !disabled) confirm();
          }}
          placeholder="image-name"
          autoFocus
          className="w-full px-3 py-2 mb-6 border border-rule dark:border-night-rule bg-transparent text-ink dark:text-chalk focus:outline-hidden focus:border-ink dark:focus:border-chalk rounded-xs"
        />

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={disabled}
            className="px-4 py-1.5 text-sm text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk disabled:opacity-30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={disabled || !completed?.width}
            className="px-4 py-1.5 text-sm bg-ink dark:bg-chalk text-white dark:text-night hover:opacity-90 disabled:opacity-30 transition-opacity rounded-xs"
          >
            {disabled ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
