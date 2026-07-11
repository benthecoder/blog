"use client";

import { useState, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import RenderPost from "@/components/posts/RenderPost";
import MarkdownPreview from "@/components/posts/MarkdownPreview";
import matter from "gray-matter";
import { Calendar, Eye, FileEdit, ImageIcon, Trash2 } from "lucide-react";
import { usePostDraft } from "./usePostDraft";
import { useImageManager } from "./useImageManager";
import { ConfirmModal, type ConfirmConfig } from "./ConfirmModal";
import { ImageNameModal } from "./ImageNameModal";
import { ImageStrip } from "./ImageStrip";
import { EditorFooter } from "./EditorFooter";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const isNew = slug === "new";

  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [editorWidth, setEditorWidth] = useState(700);
  const [modalConfig, setModalConfig] = useState<ConfirmConfig | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isResizing = useRef(false);

  const notify = (msg: string, autoClear = false) => {
    setMessage(msg);
    if (autoClear) setTimeout(() => setMessage(""), 3000);
  };

  // Shows the confirm dialog; the modal closes itself before onConfirm runs.
  const confirmAction = (
    title: string,
    confirmMessage: string,
    onConfirm: () => void
  ) => {
    setModalConfig({
      title,
      message: confirmMessage,
      onConfirm: () => {
        setModalConfig(null);
        onConfirm();
      },
    });
  };

  const draft = usePostDraft({
    slug,
    isNew,
    searchParams,
    router,
    confirmAction,
    notify,
  });

  const insertMarkdown = (snippet: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      draft.setMarkdown(
        draft.markdown.substring(0, cursorPos) +
          snippet +
          draft.markdown.substring(cursorPos)
      );
    } else {
      draft.setMarkdown(draft.markdown + "\n" + snippet);
    }
  };

  const images = useImageManager({
    slug,
    isNew,
    searchParams,
    insertMarkdown,
    notify,
  });

  const handleResizeStart = (e: ReactMouseEvent, side: "left" | "right") => {
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

  const monthParam = searchParams.get("month");

  return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div
        style={{ width: `${editorWidth}px`, height: "calc(100vh - 4rem)" }}
        className="flex flex-col relative group border-l border-r border-gray-200 dark:border-gray-700"
      >
        {/* Top bar */}
        <div className="border-b border-japanese-shiraumenezu dark:border-gray-700 px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href={monthParam ? `/admin?month=${monthParam}` : "/admin"}
              className="text-japanese-ginnezu dark:text-gray-500 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
              title="Back to calendar"
            >
              <Calendar size={18} />
            </Link>
            {draft.isDraft && !isNew && (
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
            {images.uploading && (
              <span className="text-xs text-japanese-ginnezu dark:text-gray-500">
                Uploading...
              </span>
            )}
            {draft.hasUnsavedChanges && !draft.saving && !message && (
              <div
                className="w-1.5 h-1.5 rounded-full bg-orange-500"
                title="Unsaved changes (⌘S to save)"
              />
            )}
            {!isNew && images.postImages.length > 0 && (
              <button
                onClick={() => images.setShowImages(!images.showImages)}
                className="text-japanese-ginnezu dark:text-gray-500 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors relative"
                title="Manage images"
              >
                <ImageIcon size={18} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full text-[8px] text-white flex items-center justify-center">
                  {images.postImages.length}
                </span>
              </button>
            )}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-japanese-ginnezu dark:text-gray-500 hover:text-japanese-sumiiro dark:hover:text-japanese-shironezu transition-colors"
              title={showPreview ? "Edit" : "Preview"}
            >
              {showPreview ? <FileEdit size={18} /> : <Eye size={18} />}
            </button>
            {draft.isDraft && (
              <button
                onClick={draft.handlePublish}
                disabled={draft.publishing || isNew}
                className="px-3 py-1.5 text-xs bg-japanese-sumiiro dark:bg-japanese-shironezu text-white dark:text-japanese-sumiiro hover:opacity-90 disabled:opacity-30 transition-opacity rounded-xs"
              >
                {draft.publishing ? "Publishing..." : "Publish"}
              </button>
            )}
            {!draft.isDraft && !isNew && (
              <button
                onClick={draft.handleUnpublish}
                disabled={draft.publishing}
                className="px-3 py-1.5 text-xs text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 disabled:opacity-30 transition-colors rounded-xs"
              >
                {draft.publishing ? "Moving..." : "Unpublish"}
              </button>
            )}
            {!isNew && (
              <button
                onClick={draft.handleDelete}
                disabled={draft.deleting}
                className="text-japanese-ginnezu dark:text-gray-500 hover:text-red-600 dark:hover:text-red-500 disabled:opacity-30 transition-colors"
                title="Delete post"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        {images.showImages && !isNew && (
          <ImageStrip
            slug={slug}
            isDraft={draft.isDraft}
            images={images.postImages}
            onClose={() => images.setShowImages(false)}
            onDelete={images.handleDeleteImage}
          />
        )}

        {/* Editor / preview pane */}
        <div className={`flex-1 overflow-hidden ${isNew ? "pb-0" : "pb-10"}`}>
          {showPreview ? (
            <div className="h-full overflow-y-auto p-8">
              {(() => {
                const { data: frontmatter, content } = matter(draft.markdown);

                const post = {
                  data: {
                    title: (frontmatter.title || "Untitled").toString(),
                    tags: (frontmatter.tags || "").toString(),
                    date: (frontmatter.date || draft.date).toString(),
                  },
                  content: content,
                };

                return (
                  <RenderPost post={post} prev={null} next={null} slug={null}>
                    <MarkdownPreview content={post.content} />
                  </RenderPost>
                );
              })()}
            </div>
          ) : (
            <>
              <div
                className={`h-full p-8 transition-colors ${images.isDragging ? "bg-blue-50 dark:bg-blue-950 border-2 border-dashed border-blue-400" : ""}`}
                onDragOver={images.handleDragOver}
                onDragLeave={images.handleDragLeave}
                onDrop={images.handleDrop}
              >
                <textarea
                  ref={textareaRef}
                  value={draft.markdown}
                  onChange={(e) => draft.setMarkdown(e.target.value)}
                  onPaste={images.handlePaste}
                  placeholder="---&#10;title: &#10;tags: &#10;date: &#10;---&#10;&#10;Write your content here..."
                  className="w-full h-full font-mono text-base p-4 resize-none focus:outline-hidden bg-transparent"
                />
              </div>
              {images.isDragging && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-2xl text-japanese-sumiiro dark:text-japanese-shironezu font-light tracking-wide">
                    Drop images here
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Resize handles */}
        <div
          className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize"
          onMouseDown={(e) => handleResizeStart(e, "left")}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize"
          onMouseDown={(e) => handleResizeStart(e, "right")}
        />

        <EditorFooter
          isNew={isNew}
          date={draft.date}
          prevSlug={draft.prevSlug}
          nextSlug={draft.nextSlug}
          prevDate={draft.prevDate}
          nextDate={draft.nextDate}
          monthParam={monthParam}
        />

        {images.showImageNameModal && (
          <ImageNameModal
            value={images.imageNameInput}
            onChange={images.setImageNameInput}
            onConfirm={images.confirmImageUpload}
            onCancel={images.cancelImageUpload}
          />
        )}

        {modalConfig && (
          <ConfirmModal
            config={modalConfig}
            onCancel={() => setModalConfig(null)}
          />
        )}
      </div>
    </div>
  );
}
