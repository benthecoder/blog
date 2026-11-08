"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from "react-image-crop";
import type { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { ViewerButton } from "./ViewerButton";

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
function toSourceRect(
  image: HTMLImageElement,
  crop: PixelCrop,
  sourceWidth: number,
  sourceHeight: number
): CropRect {
  const scaleX = sourceWidth / image.width;
  const scaleY = sourceHeight / image.height;
  const x = Math.max(0, Math.round(crop.x * scaleX));
  const y = Math.max(0, Math.round(crop.y * scaleY));
  return {
    x,
    y,
    // Clamp so rounding can never ask for a pixel past the edge.
    width: Math.min(Math.round(crop.width * scaleX), sourceWidth - x),
    height: Math.min(Math.round(crop.height * scaleY), sourceHeight - y),
  };
}

/**
 * Crop mode of the photo viewer: crop, rotate and name a photo before it is
 * inserted. Rotation and crop are only described here; sharp applies them to
 * the untouched original on upload. The name is selected on entry. R rotates
 * (outside the name field), Enter inserts; leaving (Esc or
 * "back") is the viewer's call.
 */
export function ImageCropper({
  file,
  name,
  fallbackSrc,
  onNameChange,
  onConfirm,
  onBack,
}: {
  file: File;
  /** Shown at the same size until the cropper's own preview is ready. */
  fallbackSrc: string;
  name: string;
  onNameChange: (value: string) => void;
  onConfirm: (
    file: File,
    crop: CropRect | null,
    rotation: number
  ) => Promise<boolean | undefined>;
  onBack: () => void;
}) {
  const [src, setSrc] = useState("");
  const [rotation, setRotation] = useState(0);
  const [original, setOriginal] = useState<{
    file: File;
    image: HTMLImageElement;
  } | null>(null);
  const [previewAngle, setPreviewAngle] = useState<number | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completed, setCompleted] = useState<PixelCrop>();
  // Square by default: post images render as square plates, so this is the
  // framing that will actually be shown.
  const [aspect, setAspect] = useState<number | undefined>(1);
  const [busy, setBusy] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // The name is prefilled and selected: type to replace it, or Enter to insert.
  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (!cancelled) setOriginal({ file, image });
    };
    image.onerror = () => {
      if (!cancelled) setPreviewError("Couldn’t load this image.");
    };
    image.src = url;
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    if (!original || original.file !== file) return;
    let cancelled = false;
    let previewUrl: string | undefined;
    const image = original.image;
    const scale = Math.min(
      1,
      2400 / Math.max(image.naturalWidth, image.naturalHeight)
    );
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);
    const sideways = rotation === 90 || rotation === 270;
    const canvas = document.createElement("canvas");
    canvas.width = sideways ? height : width;
    canvas.height = sideways ? width : height;
    const context = canvas.getContext("2d");
    if (!context) {
      queueMicrotask(() => {
        if (!cancelled) setPreviewError("Couldn’t prepare the image preview.");
      });
      return () => {
        cancelled = true;
      };
    }
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((rotation * Math.PI) / 180);
    context.drawImage(image, -width / 2, -height / 2, width, height);
    // Preview only. The untouched original is rotated and cropped by sharp on upload.
    canvas.toBlob(
      (blob) => {
        if (cancelled) return;
        if (!blob) {
          setPreviewError("Couldn’t prepare the image preview.");
          return;
        }
        previewUrl = URL.createObjectURL(blob);
        setSrc(previewUrl);
        setPreviewAngle(rotation);
      },
      "image/jpeg",
      0.92
    );
    return () => {
      cancelled = true;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [original, file, rotation]);

  const sideways = rotation === 90 || rotation === 270;
  const sourceWidth = original
    ? sideways
      ? original.image.naturalHeight
      : original.image.naturalWidth
    : 0;
  const sourceHeight = original
    ? sideways
      ? original.image.naturalWidth
      : original.image.naturalHeight
    : 0;
  const previewReady = Boolean(
    src && original?.file === file && previewAngle === rotation
  );

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const next = centeredCrop(width, height, aspect);
      setCrop(next);
      setCompleted(convertToPixelCrop(next, width, height));
    },
    [aspect]
  );

  const changeAspect = (next: number | undefined) => {
    setAspect(next);
    const img = imgRef.current;
    if (img) {
      const selection = centeredCrop(img.width, img.height, next);
      setCrop(selection);
      setCompleted(convertToPixelCrop(selection, img.width, img.height));
    }
  };

  const confirm = async () => {
    const img = imgRef.current;
    if (!previewReady || !img || !completed?.width || !completed?.height)
      return;
    const rect = toSourceRect(img, completed, sourceWidth, sourceHeight);
    // A selection covering the whole frame needs no extract step at all.
    const full =
      rect.x === 0 &&
      rect.y === 0 &&
      rect.width === sourceWidth &&
      rect.height === sourceHeight;
    setBusy(true);
    try {
      await onConfirm(file, full ? null : rect, rotation);
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy;
  const rotate = (turn: number) => {
    setRotation((angle) => (angle + turn) % 360);
    setCompleted(undefined);
  };

  return (
    <div
      onKeyDown={(event) => {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        const typing = event.target instanceof HTMLInputElement;
        if (event.key === "r" && !typing && original && !disabled) {
          event.preventDefault();
          rotate(event.shiftKey ? 270 : 90);
        } else if (
          event.key === "Enter" &&
          !(event.target instanceof HTMLButtonElement)
        ) {
          event.preventDefault();
          if (!disabled && previewReady && completed?.width) void confirm();
        }
      }}
    >
      {/* Same box as the viewer's, so the photo doesn't move between modes. */}
      <div
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-label="Crop area"
        className="flex h-[78dvh] w-[92vw] items-center justify-center focus-visible:outline-hidden"
      >
        {previewReady ? (
          <ReactCrop
            disabled={busy}
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
              style={{ maxHeight: "78dvh", maxWidth: "92vw", width: "auto" }}
            />
          </ReactCrop>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fallbackSrc}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      <div className="mt-3 flex h-18 flex-col items-center justify-center gap-1">
        {previewError && (
          <p role="alert" className="text-xs text-chalk-strong">
            {previewError}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center">
          <ViewerButton
            disabled={disabled || !original}
            onClick={() => rotate(90)}
            title="Rotate right 90° (R), left with Shift"
          >
            rotate r
          </ViewerButton>
          {(
            [
              ["square", 1],
              ["4:3", 4 / 3],
              ["3:4", 3 / 4],
              ["free", undefined],
            ] as const
          ).map(([label, value]) => (
            <ViewerButton
              key={label}
              disabled={disabled || !previewReady}
              pressed={aspect === value}
              onClick={() => changeAspect(value)}
            >
              {label}
            </ViewerButton>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2">
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            aria-label="Image name"
            placeholder="image-name"
            className="w-44 border-b border-chalk/40 bg-transparent px-1 py-1 text-sm text-chalk-strong placeholder:text-chalk-muted focus:border-chalk focus:outline-hidden"
          />
          <ViewerButton onClick={onBack} disabled={disabled}>
            back esc
          </ViewerButton>
          <ViewerButton
            onClick={confirm}
            disabled={disabled || !previewReady || !completed?.width}
          >
            insert ⏎
          </ViewerButton>
        </div>
      </div>
    </div>
  );
}
