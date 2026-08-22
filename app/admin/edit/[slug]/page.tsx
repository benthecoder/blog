"use client";

import { useState, useRef, useMemo } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import RenderPost from "@/components/posts/RenderPost";
import MarkdownPreview from "@/components/posts/MarkdownPreview";
import matter from "gray-matter";
import { Calendar, Eye, FileEdit, ImageIcon, Trash2 } from "lucide-react";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownKeymap } from "@codemirror/lang-markdown";
import { keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { usePostDraft } from "./usePostDraft";
import { useImageManager } from "./useImageManager";
import { ConfirmModal, type ConfirmConfig } from "./ConfirmModal";
import { ImageCropModal } from "./ImageCropModal";
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
  const cmRef = useRef<ReactCodeMirrorRef>(null);
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
    const view = cmRef.current?.view;
    if (view) {
      const pos = view.state.selection.main.head;
      view.dispatch({
        changes: { from: pos, insert: snippet },
        selection: { anchor: pos + snippet.length },
      });
      view.focus();
    } else {
      draft.setMarkdown(draft.markdown + "\n" + snippet);
    }
  };

  const images = useImageManager({
    slug,
    isNew,
    isPublished: !draft.isDraft && !isNew,
    searchParams,
    insertMarkdown,
    notify,
  });

  // Kept in a ref (not a useMemo dep) so the CodeMirror `extensions` array
  // stays referentially stable across renders — passing a new array on
  // every render makes @uiw/react-codemirror rebuild editor state and lose
  // undo history.
  const handleImagePasteRef = useRef(images.handlePaste);
  handleImagePasteRef.current = images.handlePaste;

  const extensions = useMemo(
    () => [
      // bundles pasteURLAsLink (paste URL over a selection -> link).
      // SetextHeading is removed because frontmatter (text immediately
      // followed by a bare "---" line) is valid CommonMark for an H2
      // heading, so without this every post's frontmatter block would be
      // highlighted as a heading.
      markdown({ extensions: { remove: ["SetextHeading"] } }),
      EditorView.lineWrapping,
      // `indentWithTab` binds Tab to indent, which means Tab no longer moves
      // focus out of the editor. Escape releases it, so the editor is still
      // escapable by keyboard alone: Escape, then Tab.
      Prec.highest(
        keymap.of([
          {
            key: "Escape",
            run: (view) => {
              view.contentDOM.blur();
              return true;
            },
          },
          indentWithTab,
          ...markdownKeymap,
        ])
      ),
      EditorView.domEventHandlers({
        paste: (event) => {
          const items = Array.from(event.clipboardData?.items ?? []);
          const hasImage = items.some((item) => item.type.startsWith("image/"));
          if (hasImage) {
            handleImagePasteRef.current(event);
            return true;
          }
          return false;
        },
      }),
      EditorView.theme({
        "&": { backgroundColor: "transparent", height: "100%" },
        ".cm-content": {
          padding: "1rem",
          caretColor: "currentColor",
          fontFamily: "inherit",
          fontSize: "inherit",
        },
        ".cm-scroller": {
          fontFamily: "inherit",
          scrollbarWidth: "thin",
          scrollbarColor: "var(--scrollbar-thumb) transparent",
        },
        "&.cm-focused": { outline: "none" },
      }),
    ],
    []
  );

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
    <div className="h-screen flex items-center justify-center bg-paper dark:bg-night">
      <div
        style={{
          width: showPreview ? "min(900px, 100vw - 4rem)" : `${editorWidth}px`,
          height: "calc(100vh - 4rem)",
        }}
        className="flex flex-col relative group border-l border-r border-rule dark:border-night-rule transition-[width] duration-200"
      >
        {/* Top bar */}
        <div className="border-b border-rule dark:border-night-rule px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href={monthParam ? `/admin?month=${monthParam}` : "/admin"}
              className="text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk transition-colors"
              title="Back to calendar"
            >
              <Calendar size={18} />
            </Link>
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
              <span className="text-xs text-ink-soft dark:text-chalk-muted">
                Uploading...
              </span>
            )}
            {draft.hasUnsavedChanges && !draft.saving && !message && (
              <div
                className="w-1.5 h-1.5 rounded-full bg-orange-500"
                title="Unsaved changes (⌘S to save)"
              />
            )}
            <div className="flex items-center gap-1">
              {!isNew && images.postImages.length > 0 && (
                <button
                  onClick={() => images.setShowImages(!images.showImages)}
                  className="p-1.5 rounded-xs text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk hover:bg-paper dark:hover:bg-night-raised transition-[color,background-color,transform] active:scale-90 relative"
                  title="Manage images"
                >
                  <ImageIcon size={18} />
                  <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-ink dark:bg-chalk rounded-full text-[8px] text-white dark:text-night flex items-center justify-center">
                    {images.postImages.length}
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="p-1.5 rounded-xs text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk hover:bg-paper dark:hover:bg-night-raised transition-[color,background-color,transform] active:scale-90"
                title={showPreview ? "Edit" : "Preview"}
              >
                {showPreview ? <FileEdit size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="w-px self-stretch bg-rule dark:bg-night-rule" />

            {draft.isDraft && (
              <button
                onClick={draft.handlePublish}
                disabled={draft.publishing || isNew}
                className="px-3 py-1.5 text-xs font-medium bg-ink dark:bg-chalk text-white dark:text-night hover:opacity-90 disabled:opacity-30 transition-[opacity,transform] active:scale-97 rounded-xs"
              >
                {draft.publishing ? "Publishing..." : "Publish"}
              </button>
            )}
            {!draft.isDraft && !isNew && (
              <button
                onClick={draft.handleUnpublish}
                disabled={draft.publishing}
                className="px-3 py-1.5 text-xs text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 disabled:opacity-30 transition-[background-color,transform] active:scale-97 rounded-xs"
              >
                {draft.publishing ? "Moving..." : "Unpublish"}
              </button>
            )}
            {!isNew && (
              <button
                onClick={draft.handleDelete}
                disabled={draft.deleting}
                className="p-1.5 rounded-xs text-ink-soft dark:text-chalk-muted hover:text-red-600 dark:hover:text-red-500 hover:bg-paper dark:hover:bg-night-raised disabled:opacity-30 transition-[color,background-color,transform] active:scale-90"
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
            images={images.postImages}
            onClose={() => images.setShowImages(false)}
            onDelete={images.handleDeleteImage}
          />
        )}

        {/* Editor / preview pane */}
        <div className={`flex-1 overflow-hidden ${isNew ? "pb-0" : "pb-10"}`}>
          {showPreview ? (
            <div className="h-full overflow-y-auto p-8 admin-scrollbar">
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
                <CodeMirror
                  ref={cmRef}
                  value={draft.markdown}
                  onChange={(value) => draft.setMarkdown(value)}
                  extensions={extensions}
                  theme="none"
                  basicSetup={{
                    lineNumbers: false,
                    foldGutter: false,
                    highlightActiveLine: false,
                    highlightActiveLineGutter: false,
                    highlightSelectionMatches: false,
                    // Bracket/quote auto-pairing is a code-editor habit; in
                    // prose it silently inserts a phantom closing quote
                    // whenever you type an apostrophe (e.g. "Jesus'"),
                    // which shifts characters and can corrupt a markdown
                    // link's "](url)" right after it.
                    closeBrackets: false,
                  }}
                  placeholder={
                    "---\ntitle: \ntags: \ndate: \n---\n\nWrite your content here..."
                  }
                  className="w-full h-full font-mono text-base text-ink-strong dark:text-chalk-strong"
                />
              </div>
              {images.isDragging && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-2xl text-ink dark:text-chalk font-light tracking-wide">
                    Drop images here
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Resize handles (editing only — preview width is fixed) */}
        {!showPreview && (
          <>
            <div
              className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize"
              onMouseDown={(e) => handleResizeStart(e, "left")}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize"
              onMouseDown={(e) => handleResizeStart(e, "right")}
            />
          </>
        )}

        <EditorFooter
          isNew={isNew}
          date={draft.date}
          prevSlug={draft.prevSlug}
          nextSlug={draft.nextSlug}
          prevDate={draft.prevDate}
          nextDate={draft.nextDate}
          monthParam={monthParam}
        />

        {images.showImageNameModal && images.pendingImageFile && (
          <ImageCropModal
            file={images.pendingImageFile}
            name={images.imageNameInput}
            onNameChange={images.setImageNameInput}
            onConfirm={images.confirmImageUpload}
            onCancel={images.cancelImageUpload}
            uploading={images.uploading}
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
