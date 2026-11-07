"use client";

import { useEffect, useRef } from "react";
import { animateIn } from "@/components/admin/enterAnimation";
import { ImageCropper } from "./ImageCropper";
import type { CropRect } from "./ImageCropper";

/**
 * The large centered preview where a photo is cropped, rotated and named.
 * Opened from a tray tile it grows out of that tile; Esc goes back.
 */
export function PhotoPreview({
  file,
  name,
  origin,
  onNameChange,
  onConfirm,
  onCancel,
}: {
  file: File;
  name: string;
  /** The tile it opened from, in viewport coordinates. */
  origin: DOMRect | null;
  onNameChange: (value: string) => void;
  onConfirm: (
    file: File,
    crop: CropRect | null,
    rotation: number
  ) => Promise<boolean | undefined>;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // The dialog is unmounted with its content, so give focus back by hand.
    const opener = document.activeElement;
    dialog.showModal();
    // showModal focuses the first control; the name is what you type next.
    const name = dialog.querySelector("input");
    name?.focus();
    name?.select();
    const box = dialog.getBoundingClientRect();
    animateIn(dialog, {
      from: origin ? 0.5 : 0.96,
      duration: 180,
      origin: origin
        ? `${origin.left + origin.width / 2 - box.left}px ${origin.top + origin.height / 2 - box.top}px`
        : "50% 50%",
    });
    return () => {
      dialog.close();
      if (opener instanceof HTMLElement) opener.focus();
    };
    // Only the first placement matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <dialog
      ref={dialogRef}
      aria-label="Photo preview"
      className="m-auto bg-raised text-primary shadow-lg p-6 w-[calc(100vw-2rem)] max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto admin-scrollbar rounded-xs backdrop:bg-night/40"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <ImageCropper
        file={file}
        name={name}
        onNameChange={onNameChange}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </dialog>
  );
}
