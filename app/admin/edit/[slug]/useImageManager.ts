"use client";

import { useState, useEffect, useCallback } from "react";
import type { DragEvent } from "react";
import type { useSearchParams } from "next/navigation";
import type { PostImage } from "./ImageStrip";
import type { CropRect } from "./ImageCropModal";

interface UseImageManagerArgs {
  slug: string;
  isNew: boolean;
  /** True once the post has been published (i.e. no longer a draft). */
  isPublished: boolean;
  searchParams: ReturnType<typeof useSearchParams>;
  /** Insert a markdown snippet at the editor cursor. */
  insertMarkdown: (snippet: string) => void;
  /** Surface a status message in the top bar. */
  notify: (message: string) => void;
}

/**
 * Owns the post's image workflow: listing, upload (via drag-drop, paste, or
 * the naming modal), and deletion.
 */
export function useImageManager({
  slug,
  isNew,
  isPublished,
  searchParams,
  insertMarkdown,
  notify,
}: UseImageManagerArgs) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [postImages, setPostImages] = useState<PostImage[]>([]);
  const [showImages, setShowImages] = useState(false);
  const [showImageNameModal, setShowImageNameModal] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imageNameInput, setImageNameInput] = useState("");

  // Refresh images list; stable identity so the effect below can depend on it
  const refreshImages = useCallback(() => {
    if (isNew) return;

    fetch(`/api/admin/list-images?slug=${slug}`)
      .then((res) => res.json())
      .then((images: PostImage[]) => setPostImages(images))
      .catch((err) => console.error("Error loading images:", err));
  }, [slug, isNew]);

  // Load images for this post on mount
  useEffect(() => {
    refreshImages();
  }, [refreshImages]);

  const handleDeleteImage = async (fileName: string) => {
    try {
      const response = await fetch(
        `/api/admin/delete-image?fileName=${encodeURIComponent(fileName)}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        notify(`✓ Deleted ${fileName}`);
        refreshImages();
      } else {
        notify(`✗ Failed to delete ${fileName}`);
      }
    } catch (error) {
      notify(`✗ Error: ${error}`);
    }
  };

  const handleImageUpload = async (
    file: File,
    customName?: string,
    crop?: CropRect | null
  ) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Prefix image name with slug (or date for new posts)
      let prefix = slug;
      if (isNew) {
        const dateParam = searchParams.get("date");
        if (dateParam) {
          const [year, month, day] = dateParam.split("-");
          prefix = `${day}${month}${year.slice(2)}`; // DDMMYY format
        }
      }
      const finalName = customName ? `${prefix}-${customName}` : null;
      if (finalName) {
        formData.append("name", finalName);
      }
      // Published posts never run publish-post again, so their images must
      // go straight to R2 rather than staging in drafts.
      formData.append("published", String(isPublished));
      // The original file goes up untouched and sharp cuts the crop from it,
      // so the image is only JPEG-encoded once. Cropping in the browser first
      // meant two lossy passes, which showed as softness.
      if (crop) formData.append("crop", JSON.stringify(crop));

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        insertMarkdown(`![](${data.url})`);
        notify(`✓ Image uploaded: ${data.fileName}`);
        refreshImages();
      } else {
        notify(`✗ Upload failed: ${data.error}`);
      }
    } catch (error) {
      notify(`✗ Upload error: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length > 0) {
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

  /** The modal hands back the original file plus the region to cut from it. */
  const confirmImageUpload = async (
    original?: File,
    crop?: CropRect | null
  ) => {
    const file = original ?? pendingImageFile;
    if (!file) return;

    const rawName = imageNameInput.trim() || file.name.replace(/\.[^/.]+$/, "");
    // Standardize: lowercase and replace spaces with hyphens
    const finalName = rawName.toLowerCase().replace(/\s+/g, "-");
    await handleImageUpload(file, finalName, crop);

    setShowImageNameModal(false);
    setPendingImageFile(null);
    setImageNameInput("");
  };

  const cancelImageUpload = () => {
    setShowImageNameModal(false);
    setPendingImageFile(null);
  };

  // Structural rather than React's ClipboardEvent: the CodeMirror editor
  // hands this the native DOM event, and only these two members are used —
  // so both satisfy it without a cast at the call site.
  const handlePaste = async (e: {
    clipboardData: DataTransfer | null;
    preventDefault: () => void;
  }) => {
    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItem = items.find((item) => item.type.startsWith("image/"));

    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
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
    uploading,
    isDragging,
    postImages,
    showImages,
    setShowImages,
    showImageNameModal,
    pendingImageFile,
    imageNameInput,
    setImageNameInput,
    handleDeleteImage,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
    confirmImageUpload,
    cancelImageUpload,
  };
}
