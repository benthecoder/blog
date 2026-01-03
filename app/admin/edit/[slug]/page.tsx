"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RenderPost } from "@/components/posts";
import matter from "gray-matter";
import { DEFAULT_POST_TEMPLATE } from "@/lib/post-template";
import {
  LuCalendar,
  LuChevronLeft,
  LuChevronRight,
  LuEye,
  LuFileEdit,
  LuImage,
  LuX,
} from "react-icons/lu";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const isNew = slug === "new";

  const [date, setDate] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editorWidth, setEditorWidth] = useState(700);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [showImageNameModal, setShowImageNameModal] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imageNameInput, setImageNameInput] = useState("");
  const [prevSlug, setPrevSlug] = useState<string | null>(null);
  const [nextSlug, setNextSlug] = useState<string | null>(null);
  const [prevDate, setPrevDate] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);
  const [postImages, setPostImages] = useState<string[]>([]);
  const [showImages, setShowImages] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isResizing = useRef(false);
  const initialContentRef = useRef({ markdown: "" });

  // Fetch all posts to determine prev/next for existing posts
  useEffect(() => {
    if (isNew) return;

    const abortController = new AbortController();

    fetch("/api/admin/list-posts", { signal: abortController.signal })
      .then((res) => res.json())
      .then((sortedPosts: string[]) => {
        const currentIndex = sortedPosts.indexOf(slug);

        setPrevSlug(currentIndex > 0 ? sortedPosts[currentIndex - 1] : null);
        setNextSlug(
          currentIndex < sortedPosts.length - 1
            ? sortedPosts[currentIndex + 1]
            : null
        );
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Error loading posts:", err);
        }
      });

    return () => abortController.abort();
  }, [slug, isNew]);

  // Calculate prev/next dates for new posts
  useEffect(() => {
    if (!isNew) return;

    const dateParam = searchParams.get("date");
    if (!dateParam) return;

    const currentDate = new Date(dateParam);

    // Previous day
    const prevDateObj = new Date(currentDate);
    prevDateObj.setDate(prevDateObj.getDate() - 1);
    const prevDateStr = `${prevDateObj.getFullYear()}-${String(prevDateObj.getMonth() + 1).padStart(2, "0")}-${String(prevDateObj.getDate()).padStart(2, "0")}`;
    setPrevDate(prevDateStr);

    // Next day
    const nextDateObj = new Date(currentDate);
    nextDateObj.setDate(nextDateObj.getDate() + 1);
    const nextDateStr = `${nextDateObj.getFullYear()}-${String(nextDateObj.getMonth() + 1).padStart(2, "0")}-${String(nextDateObj.getDate()).padStart(2, "0")}`;
    setNextDate(nextDateStr);
  }, [isNew, searchParams]);

  useEffect(() => {
    const draftKey = `draft-${slug}`;

    if (!isNew) {
      fetch(`/api/admin/get-post?slug=${slug}`)
        .then((res) => res.json())
        .then((data) => {
          const rawContent = matter.stringify(data.content, {
            title: data.title,
            tags: data.tags,
            date: data.date,
          });
          setMarkdown(rawContent);
          setDate(data.date);
          setIsDraft(data.isDraft ?? false);
          initialContentRef.current = { markdown: rawContent };
        })
        .catch((err) => console.error("Error loading post:", err));
    } else {
      const dateParam = searchParams.get("date");
      if (dateParam) {
        const [year, month, day] = dateParam.split("-");
        const dateObj = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        const formattedDate = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        setDate(formattedDate);
        // Use the template and replace the date placeholder
        const templateWithDate = DEFAULT_POST_TEMPLATE.replace(
          "date:",
          `date: ${formattedDate}`
        );
        setMarkdown(templateWithDate);

        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          // Only show the draft if it's from the same date
          if (draft.date === formattedDate) {
            setModalConfig({
              title: "Draft Found",
              message: `Found unsaved draft from ${new Date(draft.timestamp).toLocaleString()}. Restore it?`,
              onConfirm: () => {
                setMarkdown(draft.markdown);
                setShowModal(false);
              },
            });
            setShowModal(true);
          } else {
            // Remove outdated draft from different date
            localStorage.removeItem(draftKey);
          }
        }
      }
    }
  }, [slug, isNew, searchParams]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setMessage("");

    try {
      const { data: frontmatter, content } = matter(markdown);

      const parsedTitle = (frontmatter.title || "").toString().trim();
      const parsedTags = (frontmatter.tags || "").toString().trim();
      const parsedDate = (frontmatter.date || date).toString().trim();

      let slugToUse = slug;

      if (isNew) {
        const dateParam = searchParams.get("date");
        if (dateParam) {
          const [year, month, day] = dateParam.split("-");
          const yy = year.substring(2);
          slugToUse = `${day}${month}${yy}`;
        } else {
          slugToUse = `${Date.now()}`;
        }
      }

      const response = await fetch("/api/admin/save-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slugToUse,
          title: parsedTitle,
          tags: parsedTags,
          date: parsedDate,
          content: content,
          isNew,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✓ Saved!");
        setTimeout(() => setMessage(""), 3000);
        setHasUnsavedChanges(false);
        setIsDraft(data.isDraft ?? isDraft);

        const draftKey = `draft-${slugToUse}`;
        localStorage.removeItem(draftKey);
        initialContentRef.current = { markdown };

        if (isNew) {
          router.push(`/admin/edit/${data.slug}`);
        }
      } else {
        setMessage(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${error}`);
    } finally {
      setSaving(false);
    }
  }, [slug, isNew, searchParams, date, markdown, router, isDraft]);

  const handlePublish = useCallback(async () => {
    // Save first if there are unsaved changes
    if (hasUnsavedChanges) {
      await handleSave();
    }

    setPublishing(true);
    setMessage("");

    try {
      let slugToUse = slug;
      if (isNew) {
        const dateParam = searchParams.get("date");
        if (dateParam) {
          const [year, month, day] = dateParam.split("-");
          const yy = year.substring(2);
          slugToUse = `${day}${month}${yy}`;
        }
      }

      const response = await fetch("/api/admin/publish-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slugToUse }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✓ Published!");
        setTimeout(() => setMessage(""), 3000);
        setIsDraft(false);
      } else {
        setMessage(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${error}`);
    } finally {
      setPublishing(false);
    }
  }, [slug, isNew, searchParams, hasUnsavedChanges, handleSave]);

  const handleUnpublish = useCallback(async () => {
    setPublishing(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/unpublish-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✓ Moved to drafts");
        setTimeout(() => setMessage(""), 3000);
        setIsDraft(true);
      } else {
        setMessage(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${error}`);
    } finally {
      setPublishing(false);
    }
  }, [slug]);

  useEffect(() => {
    const hasChanged = markdown !== initialContentRef.current.markdown;
    setHasUnsavedChanges(hasChanged);

    if (hasChanged) {
      const draftKey = `draft-${slug}`;
      const draft = {
        markdown,
        timestamp: Date.now(),
        date,
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }
  }, [markdown, slug, date]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor && anchor.href && !anchor.href.includes("#")) {
        e.preventDefault();
        e.stopPropagation();

        setModalConfig({
          title: "Unsaved Changes",
          message: "You have unsaved changes. Are you sure you want to leave?",
          onConfirm: () => {
            setShowModal(false);
            // Temporarily disable beforeunload warning before navigating
            setHasUnsavedChanges(false);
            setTimeout(() => {
              window.location.href = anchor.href;
            }, 0);
          },
        });
        setShowModal(true);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Refresh images list
  const refreshImages = useCallback(() => {
    if (isNew) return;

    fetch(`/api/admin/list-images?slug=${slug}`)
      .then((res) => res.json())
      .then((images: string[]) => setPostImages(images))
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
        setMessage(`✓ Deleted ${fileName}`);
        refreshImages();
      } else {
        setMessage(`✗ Failed to delete ${fileName}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${error}`);
    }
  };

  const handleImageUpload = async (file: File, customName?: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Prefix image name with slug
      const finalName = customName ? `${slug}-${customName}` : null;
      if (finalName) {
        formData.append("name", finalName);
      }

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const imageMarkdown = `![](${data.url})`;
        const textarea = textareaRef.current;
        if (textarea) {
          const cursorPos = textarea.selectionStart;
          const newMarkdown =
            markdown.substring(0, cursorPos) +
            imageMarkdown +
            markdown.substring(cursorPos);
          setMarkdown(newMarkdown);
        } else {
          setMarkdown(markdown + "\n" + imageMarkdown);
        }
        setMessage(`✓ Image uploaded: ${data.fileName}`);
        refreshImages();
      } else {
        setMessage(`✗ Upload failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`✗ Upload error: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
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

  const confirmImageUpload = async () => {
    if (!pendingImageFile) return;

    const finalName =
      imageNameInput.trim() || pendingImageFile.name.replace(/\.[^/.]+$/, "");
    await handleImageUpload(pendingImageFile, finalName);

    setShowImageNameModal(false);
    setPendingImageFile(null);
    setImageNameInput("");
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));

    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        const timestamp = Date.now();
        await handleImageUpload(file, `pasted-${timestamp}`);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent, side: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;

    const startX = e.clientX;
    const startWidth = editorWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;

      const deltaX =
        side === "left"
          ? (startX - moveEvent.clientX) * 2
          : (moveEvent.clientX - startX) * 2;

      const newWidth = startWidth + deltaX;
      const minWidth = 400;
      const maxWidth = window.innerWidth - 100;

      setEditorWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div
        style={{ width: `${editorWidth}px`, height: "calc(100vh - 4rem)" }}
        className="flex flex-col relative group border-l border-r border-gray-200 dark:border-gray-700"
      >
        <div className="border-b border-japanese-shiraumenezu dark:border-gray-700 px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href={
                searchParams.get("month")
                  ? `/admin?month=${searchParams.get("month")}`
                  : "/admin"
              }
              className="text-japanese-ginnezu dark:text-gray-500 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
              title="Back to calendar"
            >
              <LuCalendar size={18} />
            </Link>
            {isDraft && !isNew && (
              <div
                className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"
                title="Draft"
              />
            )}
          </div>

          <div className="flex gap-3 items-center">
            {message && (
              <span
                className={`text-xs ${message.includes("✓") ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
              >
                {message}
              </span>
            )}
            {uploading && (
              <span className="text-xs text-japanese-ginnezu dark:text-gray-500">
                Uploading...
              </span>
            )}
            {hasUnsavedChanges && !saving && !message && (
              <div
                className="w-1.5 h-1.5 rounded-full bg-orange-500"
                title="Unsaved changes (⌘S to save)"
              />
            )}
            {!isNew && postImages.length > 0 && (
              <button
                onClick={() => setShowImages(!showImages)}
                className="text-japanese-ginnezu dark:text-gray-500 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors relative"
                title="Manage images"
              >
                <LuImage size={18} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full text-[8px] text-white flex items-center justify-center">
                  {postImages.length}
                </span>
              </button>
            )}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-japanese-ginnezu dark:text-gray-500 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
              title={showPreview ? "Edit" : "Preview"}
            >
              {showPreview ? <LuFileEdit size={18} /> : <LuEye size={18} />}
            </button>
            {isDraft && (
              <button
                onClick={handlePublish}
                disabled={publishing || isNew}
                className="px-3 py-1.5 text-xs bg-japanese-sumiiro dark:bg-japanese-shironezu text-white dark:text-japanese-sumiiro hover:opacity-90 disabled:opacity-30 transition-opacity rounded-sm"
              >
                {publishing ? "Publishing..." : "Publish"}
              </button>
            )}
            {!isDraft && !isNew && (
              <button
                onClick={handleUnpublish}
                disabled={publishing}
                className="px-3 py-1.5 text-xs text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 disabled:opacity-30 transition-colors rounded-sm"
              >
                {publishing ? "Moving..." : "Unpublish"}
              </button>
            )}
          </div>
        </div>

        {showImages && !isNew && (
          <div className="border-b border-japanese-shiraumenezu dark:border-gray-700 px-6 py-3 bg-japanese-kinairo dark:bg-gray-800/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-japanese-ginnezu dark:text-gray-500 uppercase tracking-wider">
                Images ({postImages.length})
              </span>
              <button
                onClick={() => setShowImages(false)}
                className="text-japanese-ginnezu dark:text-gray-500 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu"
              >
                <LuX size={14} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {postImages.map((img) => {
                // Determine the correct path (drafts or published)
                const imgPath = isDraft
                  ? `/images/drafts/${img}`
                  : `/images/${img}`;
                return (
                  <div key={img} className="flex-shrink-0 group relative">
                    <img
                      src={imgPath}
                      alt={img}
                      className="h-20 w-20 object-cover rounded border border-japanese-shiraumenezu dark:border-gray-700"
                    />
                    <button
                      onClick={() => handleDeleteImage(img)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <LuX size={12} />
                    </button>
                    <div className="text-[10px] text-japanese-ginnezu dark:text-gray-500 mt-1 truncate w-20">
                      {img.replace(`${slug}-`, "")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          className="flex-1 overflow-hidden"
          style={{ paddingBottom: isNew ? "0" : "40px" }}
        >
          {showPreview ? (
            <div className="h-full overflow-y-auto p-8">
              {(() => {
                const { data: frontmatter, content } = matter(markdown);

                const post = {
                  data: {
                    title: (frontmatter.title || "Untitled").toString(),
                    tags: (frontmatter.tags || "").toString(),
                    date: (frontmatter.date || date).toString(),
                  },
                  content: content,
                };

                return (
                  <RenderPost post={post} prev={null} next={null} slug={null} />
                );
              })()}
            </div>
          ) : (
            <>
              <div
                className={`h-full p-8 transition-colors ${isDragging ? "bg-blue-50 dark:bg-blue-950 border-2 border-dashed border-blue-400" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <textarea
                  ref={textareaRef}
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="---&#10;title: &#10;tags: &#10;date: &#10;---&#10;&#10;Write your content here..."
                  className="w-full h-full font-mono text-base p-4 resize-none focus:outline-none bg-transparent"
                />
              </div>
              {isDragging && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-2xl text-japanese-sumiiro dark:text-japanese-shironezu font-light tracking-wide">
                    Drop images here
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div
          className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize"
          onMouseDown={(e) => handleMouseDown(e, "left")}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize"
          onMouseDown={(e) => handleMouseDown(e, "right")}
        />

        <div className="absolute bottom-0 left-0 right-0 border-t border-japanese-shiraumenezu dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-2 flex justify-between items-center">
          {isNew ? (
            prevDate ? (
              <Link
                href={`/admin/edit/new?date=${prevDate}${searchParams.get("month") ? `&month=${searchParams.get("month")}` : ""}`}
                className="flex items-center gap-2 text-xs text-japanese-ginnezu dark:text-gray-500 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
              >
                <LuChevronLeft size={14} />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                  Previous
                </span>
              </Link>
            ) : (
              <div />
            )
          ) : prevSlug ? (
            <Link
              href={`/admin/edit/${prevSlug}${searchParams.get("month") ? `?month=${searchParams.get("month")}` : ""}`}
              className="flex items-center gap-2 text-xs text-japanese-ginnezu dark:text-gray-500 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
            >
              <LuChevronLeft size={14} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                Previous
              </span>
            </Link>
          ) : (
            <div />
          )}

          {date && (
            <span className="text-xs text-japanese-ginnezu dark:text-gray-500 tracking-wide">
              {date}
            </span>
          )}

          {isNew ? (
            nextDate ? (
              <Link
                href={`/admin/edit/new?date=${nextDate}${searchParams.get("month") ? `&month=${searchParams.get("month")}` : ""}`}
                className="flex items-center gap-2 text-xs text-japanese-ginnezu dark:text-gray-500 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                  Next
                </span>
                <LuChevronRight size={14} />
              </Link>
            ) : (
              <div />
            )
          ) : nextSlug ? (
            <Link
              href={`/admin/edit/${nextSlug}${searchParams.get("month") ? `?month=${searchParams.get("month")}` : ""}`}
              className="flex items-center gap-2 text-xs text-japanese-ginnezu dark:text-gray-500 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                Next
              </span>
              <LuChevronRight size={14} />
            </Link>
          ) : (
            <div />
          )}
        </div>

        {showImageNameModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 border border-japanese-shiraumenezu dark:border-gray-700 p-8 max-w-md mx-4 w-full">
              <h2 className="text-lg font-light mb-4 text-japanese-sumiiro dark:text-japanese-shironezu tracking-wide">
                Name your image
              </h2>
              <input
                type="text"
                value={imageNameInput}
                onChange={(e) => setImageNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmImageUpload();
                  if (e.key === "Escape") {
                    setShowImageNameModal(false);
                    setPendingImageFile(null);
                  }
                }}
                placeholder="image-name"
                autoFocus
                className="w-full px-3 py-2 mb-6 border border-japanese-shiraumenezu dark:border-gray-700 bg-transparent text-japanese-sumiiro dark:text-japanese-shironezu focus:outline-none focus:border-japanese-sumiiro dark:focus:border-japanese-shironezu rounded-sm"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowImageNameModal(false);
                    setPendingImageFile(null);
                  }}
                  className="px-4 py-1.5 text-sm text-japanese-ginnezu dark:text-gray-500 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmImageUpload}
                  className="px-4 py-1.5 text-sm bg-japanese-sumiiro dark:bg-japanese-shironezu text-white dark:text-japanese-sumiiro hover:opacity-90 transition-opacity rounded-sm"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && modalConfig && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 border border-japanese-shiraumenezu dark:border-gray-700 p-8 max-w-md mx-4">
              <h2 className="text-lg font-light mb-4 text-japanese-sumiiro dark:text-japanese-shironezu tracking-wide">
                {modalConfig.title}
              </h2>
              <p className="text-sm text-japanese-ginnezu dark:text-gray-400 mb-8">
                {modalConfig.message}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 text-sm border border-japanese-shiraumenezu dark:border-gray-700 text-japanese-sumiiro dark:text-japanese-shironezu hover:border-japanese-sumiiro dark:hover:border-japanese-shironezu transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={modalConfig.onConfirm}
                  className="px-4 py-1.5 text-sm border border-japanese-sumiiro dark:border-japanese-shironezu text-japanese-sumiiro dark:text-japanese-shironezu hover:bg-japanese-sumiiro hover:text-white dark:hover:bg-japanese-shironezu dark:hover:text-japanese-sumiiro transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
