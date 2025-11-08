"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RenderPost } from "@/components/posts";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const isNew = slug === "new";

  const [date, setDate] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editorWidth, setEditorWidth] = useState(900);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isResizing = useRef(false);
  const initialContentRef = useRef({ markdown: "" });

  useEffect(() => {
    const draftKey = `draft-${slug}`;

    if (!isNew) {
      fetch(`/api/admin/get-post?slug=${slug}`)
        .then((res) => res.json())
        .then((data) => {
          const rawContent = `---\ntitle: ${data.title}\ntags: ${data.tags}\ndate: ${data.date}\n---\n\n${data.content}`;
          setMarkdown(rawContent);
          setDate(data.date);
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
        const initialContent = `---\ntitle: \ntags: \ndate: ${formattedDate}\n---\n\n`;
        setMarkdown(initialContent);
      }

      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setModalConfig({
          title: "Draft Found",
          message: `Found unsaved draft from ${new Date(draft.timestamp).toLocaleString()}. Restore it?`,
          onConfirm: () => {
            setMarkdown(draft.markdown);
            setShowModal(false);
          },
        });
        setShowModal(true);
      }
    }
  }, [slug, isNew, searchParams]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setMessage("");

    try {
      const frontmatterMatch = markdown.match(
        /^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/
      );
      if (!frontmatterMatch) {
        setMessage("✗ Invalid format: Missing frontmatter");
        setSaving(false);
        return;
      }

      const frontmatterText = frontmatterMatch[1];
      const content = frontmatterMatch[2];

      const titleMatch = frontmatterText.match(/title:\s*(.+)/);
      const tagsMatch = frontmatterText.match(/tags:\s*(.+)/);
      const dateMatch = frontmatterText.match(/date:\s*(.+)/);

      const parsedTitle = titleMatch ? titleMatch[1].trim() : "";
      const parsedTags = tagsMatch ? tagsMatch[1].trim() : "";
      const parsedDate = dateMatch ? dateMatch[1].trim() : date;

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
  }, [slug, isNew, searchParams, date, markdown, router]);

  useEffect(() => {
    const hasChanged = markdown !== initialContentRef.current.markdown;
    setHasUnsavedChanges(hasChanged);

    if (hasChanged) {
      const draftKey = `draft-${slug}`;
      const draft = {
        markdown,
        timestamp: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }
  }, [markdown, slug]);

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

  const handleImageUpload = async (file: File, customName?: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (customName) {
        formData.append("name", customName);
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
      for (const file of imageFiles) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9-]/g, "-")
          .toLowerCase();
        await handleImageUpload(file, cleanName);
      }
    }
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
        <div className="border-b border-japanese-shiraumenezu dark:border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-sm text-japanese-sumiiro dark:text-japanese-shironezu hover:text-japanese-ginnezu transition-colors"
            >
              ← Back
            </Link>
            {date && (
              <span className="text-xs text-japanese-ginnezu dark:text-gray-500 tracking-wide">
                {date}
              </span>
            )}
          </div>

          <div className="flex gap-4 items-center">
            {hasUnsavedChanges && !saving && !message && (
              <span className="text-xs text-japanese-ginnezu dark:text-gray-400">
                Unsaved
              </span>
            )}
            {uploading && (
              <span className="text-sm text-japanese-ginnezu">
                Uploading...
              </span>
            )}
            {message && (
              <span
                className={`text-sm ${message.includes("✓") ? "text-green-600" : "text-red-600"}`}
              >
                {message}
              </span>
            )}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-1.5 text-sm border border-japanese-shiraumenezu dark:border-gray-700 text-japanese-sumiiro dark:text-japanese-shironezu hover:border-japanese-sumiiro dark:hover:border-japanese-shironezu transition-colors"
            >
              {showPreview ? "Edit" : "Preview"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className="px-4 py-1.5 text-sm border border-japanese-sumiiro dark:border-japanese-shironezu text-japanese-sumiiro dark:text-japanese-shironezu hover:bg-japanese-sumiiro hover:text-white dark:hover:bg-japanese-shironezu dark:hover:text-japanese-sumiiro disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-japanese-sumiiro dark:disabled:hover:text-japanese-shironezu transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {showPreview ? (
            <div className="h-full overflow-y-auto p-8">
              {(() => {
                const frontmatterMatch = markdown.match(
                  /^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/
                );
                if (!frontmatterMatch) {
                  return (
                    <p className="text-red-600">Invalid markdown format</p>
                  );
                }
                const frontmatterText = frontmatterMatch[1];
                const content = frontmatterMatch[2];
                const titleMatch = frontmatterText.match(/title:\s*(.+)/);
                const tagsMatch = frontmatterText.match(/tags:\s*(.+)/);
                const dateMatch = frontmatterText.match(/date:\s*(.+)/);

                const previewTitle = titleMatch
                  ? titleMatch[1].trim()
                  : "Untitled";
                const previewTags = tagsMatch ? tagsMatch[1].trim() : "";
                const previewDate = dateMatch ? dateMatch[1].trim() : date;

                const post = {
                  data: {
                    title: previewTitle,
                    tags: previewTags,
                    date: previewDate,
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
