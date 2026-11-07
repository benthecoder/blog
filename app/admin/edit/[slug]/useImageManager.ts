"use client";

import { useState, useRef } from "react";
import type { DragEvent } from "react";
import type { useSearchParams } from "next/navigation";
import {
  PHOTO_TRANSFER_TYPE,
  readPhotoTransfer,
  photoFileUrl,
} from "@/utils/photoTransfer";
import type { CropRect } from "./ImageCropper";

interface UseImageManagerArgs {
  slug: string;
  isNew: boolean;
  /** True once the post has been published (i.e. no longer a draft). */
  isPublished: boolean;
  searchParams: ReturnType<typeof useSearchParams>;
  /** Insert an image as its own paragraph at the drop point or cursor. */
  insertMarkdown: (snippet: string) => void;
  markInsertion: (coordinates?: { x: number; y: number }) => void;
  clearInsertion: () => void;
  /** Surface a status message in the top bar. */
  notify: (message: string) => void;
}

/**
 * Owns the post's image workflow: upload (via drag-drop, paste, the photo
 * tray or the preview), and deletion. Uploads are optimistic: the Markdown
 * line goes in at once and the tile shows progress, or a retry on failure.
 */
export function useImageManager({
  slug,
  isNew,
  isPublished,
  searchParams,
  insertMarkdown,
  markInsertion,
  clearInsertion,
  notify,
}: UseImageManagerArgs) {
  const photoRequestRef = useRef<AbortController | null>(null);
  const [uploads, setUploads] = useState<
    Record<string, "uploading" | "failed">
  >({});
  const jobs = useRef(
    new Map<string, { file: File; crop: CropRect | null; rotation: number }>()
  );
  const [isDragging, setIsDragging] = useState(false);
  const [showImageNameModal, setShowImageNameModal] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imageNameInput, setImageNameInput] = useState("");

  const handleDeleteImage = async (fileName: string) => {
    try {
      const response = await fetch(
        `/api/admin/delete-image?fileName=${encodeURIComponent(fileName)}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        notify(`✓ Deleted ${fileName}`);
      } else {
        notify(`✗ Failed to delete ${fileName}`);
      }
    } catch (error) {
      notify(`✗ Error: ${String(error)}`);
    }
  };

  const send = async (url: string) => {
    const job = jobs.current.get(url);
    if (!job) return;
    setUploads((current) => ({ ...current, [url]: "uploading" }));
    const fileName = url.slice(url.lastIndexOf("/") + 1);
    try {
      const formData = new FormData();
      formData.append("file", job.file);
      formData.append("name", fileName.replace(/\.jpg$/, ""));
      // Published posts never run publish-post again, so their images must
      // go straight to R2 rather than staging in drafts.
      formData.append("published", String(isPublished));
      // The original file goes up untouched and sharp cuts the crop from it,
      // so the image is only JPEG-encoded once.
      if (job.crop) formData.append("crop", JSON.stringify(job.crop));
      formData.append("rotation", String(job.rotation));
      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error((await response.json()).error);
      jobs.current.delete(url);
      setUploads(({ [url]: _done, ...rest }) => rest);
      notify(`✓ Image uploaded: ${fileName}`);
    } catch (error) {
      setUploads((current) => ({ ...current, [url]: "failed" }));
      notify(`✗ Upload failed: ${String(error)}`);
    }
  };

  /** Puts the image line in the text now and uploads behind it. */
  const startUpload = (
    file: File,
    name: string,
    crop: CropRect | null = null,
    rotation = 0
  ) => {
    // Prefix image name with slug (or date for new posts)
    let prefix = slug;
    const dateParam = isNew ? searchParams.get("date") : null;
    if (dateParam) {
      const [year, month, day] = dateParam.split("-");
      prefix = `${day}${month}${year.slice(2)}`; // DDMMYY format
    }
    const fileName = `${prefix}-${name}.jpg`;
    const url = `${isPublished ? "/images/" : "/images/drafts/"}${fileName}`;
    jobs.current.set(url, { file, crop, rotation });
    insertMarkdown(`![](${url})`);
    void send(url);
  };

  const handleDragOver = (e: DragEvent) => {
    if (
      !e.dataTransfer.types.includes(PHOTO_TRANSFER_TYPE) &&
      !e.dataTransfer.types.includes("Files")
    )
      return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: {
    dataTransfer: DataTransfer | null;
    clientX: number;
    clientY: number;
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => {
    if (!e.dataTransfer) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (showImageNameModal || photoRequestRef.current) return;
    const photo = readPhotoTransfer(
      e.dataTransfer.getData(PHOTO_TRANSFER_TYPE) ||
        e.dataTransfer.getData("text/plain")
    );
    if (photo) {
      markInsertion({ x: e.clientX, y: e.clientY });
      const controller = new AbortController();
      photoRequestRef.current = controller;
      try {
        const response = await fetch(photoFileUrl(photo.id, "full"), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Could not load photo");
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        const name = photo.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9-]/g, "-")
          .toLowerCase();
        setPendingImageFile(
          new File([blob], `${name}.jpg`, { type: "image/jpeg" })
        );
        setImageNameInput(name);
        setShowImageNameModal(true);
      } catch {
        if (!controller.signal.aborted) {
          clearInsertion();
          notify("✗ Could not load the dropped photo. Try again.");
        }
      } finally {
        if (photoRequestRef.current === controller)
          photoRequestRef.current = null;
      }
      return;
    }
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length > 0) {
      markInsertion({ x: e.clientX, y: e.clientY });
      const file = imageFiles[0]; // Handle one at a time
      const defaultName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-]/g, "-")
        .toLowerCase();

      setPendingImageFile(file);
      setImageNameInput(defaultName);
      setShowImageNameModal(true);
    }
  };

  /** The viewer hands back the original file plus the region to cut from it. */
  const confirmImageUpload = async (
    file: File,
    name: string,
    crop: CropRect | null,
    rotation: number
  ) => {
    const rawName = name.trim() || file.name.replace(/\.[^/.]+$/, "");
    // Standardize: lowercase and replace spaces with hyphens
    startUpload(
      file,
      rawName.toLowerCase().replace(/\s+/g, "-"),
      crop,
      rotation
    );

    setShowImageNameModal(false);
    setPendingImageFile(null);
    setImageNameInput("");
    return true;
  };

  const cancelImageUpload = () => {
    clearInsertion();
    setShowImageNameModal(false);
    setPendingImageFile(null);
  };

  // Structural rather than React's ClipboardEvent: the CodeMirror editor
  // hands this the native DOM event, and only these two members are used —
  // so both satisfy it without a cast at the call site.
  // Synchronous: it only opens the crop modal; the upload happens on confirm.
  const handlePaste = (e: {
    clipboardData: DataTransfer | null;
    preventDefault: () => void;
  }) => {
    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItem = items.find((item) => item.type.startsWith("image/"));

    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        markInsertion();
        // Routed through the crop modal like drops are, rather than uploading
        // straight away — a pasted screenshot is the one most likely to need
        // trimming, and it also gets a real name instead of a timestamp.
        setPendingImageFile(file);
        setImageNameInput(`pasted-${Date.now()}`);
        setShowImageNameModal(true);
      }
    }
  };

  return {
    uploading: Object.values(uploads).includes("uploading"),
    uploads,
    retryUpload: (url: string) => void send(url),
    isDragging,
    showImageNameModal,
    pendingImageFile,
    imageNameInput,
    handleDeleteImage,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
    quickInsert: startUpload,
    confirmImageUpload,
    cancelImageUpload,
  };
}
