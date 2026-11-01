"use client";

import { useCallback, useEffect, useRef, useState, useId } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from "react-image-crop";
import type { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";

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

export function ImageCropModal({
  file,
  name,
  onNameChange,
  onConfirm,
  onCancel,
  uploading,
  error,
}: {
  file: File;
  name: string;
  onNameChange: (value: string) => void;
  onConfirm: (
    file: File,
    crop: CropRect | null,
    rotation: number
  ) => Promise<boolean | undefined>;
  onCancel: () => void;
  uploading: boolean;
  error: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    // showModal() focuses the first button; the name is what you type next.
    nameRef.current?.select();
    return () => dialog?.close();
  }, []);
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
      1600 / Math.max(image.naturalWidth, image.naturalHeight)
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
    canvas.toBlob((blob) => {
      if (cancelled) return;
      if (!blob) {
        setPreviewError("Couldn’t prepare the image preview.");
        return;
      }
      previewUrl = URL.createObjectURL(blob);
      setSrc(previewUrl);
      setPreviewAngle(rotation);
    }, "image/png");
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

  const disabled = busy || uploading;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="m-auto bg-surface border border-line p-6 w-[calc(100vw-2rem)] max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto admin-scrollbar rounded-xs backdrop:bg-night/40"
      onCancel={(event) => {
        event.preventDefault();
        if (!disabled) onCancel();
      }}
    >
      <h2
        id={titleId}
        className="text-lg font-light mb-4 text-accent tracking-wide"
      >
        crop image
      </h2>

      {/* Fixed height so the dialog doesn't jump when the image decodes. */}
      <div className="h-[55vh] flex items-center justify-center bg-paper-sunken dark:bg-night-raised rounded-xs p-2 mb-4">
        {previewReady && (
          <ReactCrop
            disabled={busy || uploading}
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
              style={{ maxHeight: "calc(55vh - 1rem)", width: "auto" }}
            />
          </ReactCrop>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1 mr-2 pr-3 border-r border-line">
          <IconButton
            aria-label="Rotate left 90 degrees"
            title="Rotate left 90°"
            disabled={disabled || !original}
            onClick={() => {
              setRotation((angle) => (angle + 270) % 360);
              setCompleted(undefined);
            }}
          >
            <RotateCcw size={18} />
          </IconButton>
          <IconButton
            aria-label="Rotate right 90 degrees"
            title="Rotate right 90°"
            disabled={disabled || !original}
            onClick={() => {
              setRotation((angle) => (angle + 90) % 360);
              setCompleted(undefined);
            }}
          >
            <RotateCw size={18} />
          </IconButton>
        </div>
        {(
          [
            ["square", 1],
            ["4:3", 4 / 3],
            ["3:4", 3 / 4],
            ["free", undefined],
          ] as const
        ).map(([label, value]) => (
          <Chip
            key={label}
            disabled={disabled || !previewReady}
            pressed={aspect === value}
            onClick={() => changeAspect(value)}
            className="rounded-xs"
          >
            {label}
          </Chip>
        ))}
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => {
          // Same as the button: upload failures show in the modal, not here.
          if (e.key === "Enter" && !disabled) void confirm();
        }}
        aria-label="Image name"
        placeholder="image-name"
        ref={nameRef}
        className="w-full px-3 py-2 mb-6 border border-line bg-transparent text-accent focus:outline-hidden focus:border-accent rounded-xs"
      />

      {(error || previewError) && (
        <p role="alert" className="mb-4 text-sm text-accent">
          {error || previewError}
        </p>
      )}
      <div className="flex gap-3 justify-end">
        <Button onClick={onCancel} disabled={disabled}>
          cancel
        </Button>
        <Button
          variant="solid"
          onClick={confirm}
          disabled={disabled || !previewReady || !completed?.width}
        >
          {disabled ? "uploading…" : "upload"}
        </Button>
      </div>
    </dialog>
  );
}
