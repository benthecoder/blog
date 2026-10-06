"use client";

import {
  useState,
  useRef,
  useMemo,
  useEffect,
  useSyncExternalStore,
} from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import RenderPost from "@/components/posts/RenderPost";
import MarkdownPreview from "@/components/posts/MarkdownPreview";
import matter from "gray-matter";
import {
  Calendar,
  Camera,
  Eye,
  FileEdit,
  ImageIcon,
  Trash2,
} from "lucide-react";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { usePostDraft } from "./usePostDraft";
import { useImageManager } from "./useImageManager";
import { ConfirmModal, type ConfirmConfig } from "./ConfirmModal";
import { ImageCropModal } from "./ImageCropModal";
import { ImageStrip } from "./ImageStrip";
import { EditorFooter } from "./EditorFooter";
import { PhotoPanel } from "./PhotoPanel";
import { TemplatePicker } from "./TemplatePicker";
import { suggestPeriods } from "@/utils/digest/schedule";
import {
  imageInsertionPoint,
  setImageInsertion,
} from "@/components/admin/imageInsertion";
import { PHOTO_TRANSFER_TYPE, readPhotoTransfer } from "@/utils/photoTransfer";
import { formatDraft } from "@/utils/content/formatDraft";
import {
  markdownEditorExtensions,
  markdownEditorSetup,
} from "@/components/admin/markdownEditorConfig";

const desktopQuery = "(min-width: 1024px)";
function subscribeToDesktop(callback: () => void) {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function isDesktop() {
  return window.matchMedia(desktopQuery).matches;
}
function serverDesktop() {
  return false;
}

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const isNew = slug === "new";

  const desktop = useSyncExternalStore(
    subscribeToDesktop,
    isDesktop,
    serverDesktop
  );
  const [message, setMessage] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editorWidth, setEditorWidth] = useState(700);
  // null = never toggled, so the default (open for drafts) applies.
  const [photosToggle, setPhotosToggle] = useState<boolean | null>(null);
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

  const dateParam = searchParams.get("date");
  const newPostDate =
    isNew && dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? new Date(
          Number(dateParam.slice(0, 4)),
          Number(dateParam.slice(5, 7)) - 1,
          Number(dateParam.slice(8, 10))
        )
      : null;

  const insertMarkdown = (snippet: string) => {
    const view = cmRef.current?.view;
    if (view) {
      const pos =
        view.state.field(imageInsertionPoint) ?? view.state.selection.main.head;
      view.dispatch({
        changes: { from: pos, insert: snippet },
        selection: { anchor: pos + snippet.length },
        effects: setImageInsertion.of(null),
      });
      view.focus();
    } else {
      draft.setMarkdown(draft.markdown + "\n" + snippet);
    }
  };

  const markInsertion = (coordinates?: { x: number; y: number }) => {
    const view = cmRef.current?.view;
    if (!view) return;
    const position =
      (coordinates ? view.posAtCoords(coordinates) : null) ??
      view.state.selection.main.head;
    view.dispatch({
      selection: { anchor: position },
      effects: setImageInsertion.of(position),
    });
  };
  const clearInsertion = () =>
    cmRef.current?.view?.dispatch({ effects: setImageInsertion.of(null) });

  const images = useImageManager({
    slug,
    isNew,
    isPublished: !draft.isDraft && !isNew,
    searchParams,
    insertMarkdown,
    markInsertion,
    clearInsertion,
    notify,
  });

  // Kept in a ref (not a useMemo dep) so the CodeMirror `extensions` array
  // stays referentially stable across renders — passing a new array on
  // every render makes @uiw/react-codemirror rebuild editor state and lose
  // undo history.
  const handleImageDropRef = useRef(images.handleDrop);
  const handleImagePasteRef = useRef(images.handlePaste);
  useEffect(() => {
    handleImagePasteRef.current = images.handlePaste;
    handleImageDropRef.current = images.handleDrop;
  }, [images.handlePaste, images.handleDrop]);

  const extensions = useMemo(
    () => [
      ...markdownEditorExtensions,
      imageInsertionPoint,
      EditorView.contentAttributes.of({ "aria-label": "Post Markdown" }),
      EditorView.domEventHandlers({
        dragover: (event) => {
          if (event.dataTransfer?.types.includes(PHOTO_TRANSFER_TYPE)) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            return true;
          }
          return false;
        },
        drop: (event) => {
          const transfer = event.dataTransfer;
          if (
            transfer &&
            (transfer.types.includes(PHOTO_TRANSFER_TYPE) ||
              readPhotoTransfer(transfer.getData("text/plain")) !== null ||
              Array.from(transfer.files).some((file) =>
                file.type.startsWith("image/")
              ))
          ) {
            void handleImageDropRef.current(event);
            return true;
          }
          return false;
        },
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

  // Day the photo panel looks at: DDMMYY slug, else the new-post date param,
  // else whatever date the loaded post carries.
  const photoDate = useMemo(() => {
    // The PhotoKit helper only runs locally; the photo routes 404 in production.
    if (process.env.NODE_ENV === "production") return null;
    const m = slug.match(/^(\d{2})(\d{2})(\d{2})$/);
    if (m) return `20${m[3]}-${m[2]}-${m[1]}`;
    const param = searchParams.get("date");
    if (isNew && param && /^\d{4}-\d{2}-\d{2}$/.test(param)) return param;
    const parsed = draft.date ? new Date(draft.date) : null;
    if (parsed && !isNaN(parsed.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
    }
    return null;
  }, [slug, isNew, searchParams, draft.date]);

  // Published posts start with the panel closed; wait for the load so the
  // default doesn't flash open before isDraft is known.
  const photosOpen =
    photosToggle ?? (desktop && draft.isDraft && (isNew || draft.date !== ""));

  const handleFormat = () => {
    const view = cmRef.current?.view;
    if (!view) return;
    const current = view.state.doc.toString();
    const formatted = formatDraft(current);
    if (formatted === current) {
      notify("✓ Already formatted", true);
      return;
    }
    // Dispatched through the view so ⌘Z undoes it.
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: formatted },
    });
  };

  useEffect(() => {
    const exitFocus = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusMode(false);
    };
    window.addEventListener("keydown", exitFocus);
    return () => window.removeEventListener("keydown", exitFocus);
  }, []);

  const bodyWords = useMemo(() => {
    // Count the writing, not frontmatter or Markdown image destinations.
    const body = draft.markdown
      .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[`#*>_~|]/g, "")
      .trim();
    return body ? body.split(/\s+/).length : 0;
  }, [draft.markdown]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-paper dark:bg-night">
      <div
        style={{
          width: showPreview ? "900px" : `${editorWidth}px`,
          maxWidth: "100vw",
          height: "100dvh",
        }}
        className="shrink-0 min-w-0 flex flex-col relative group border-l border-r border-rule dark:border-night-rule transition-[width] duration-200"
      >
        {/* Top bar */}
        <div className="border-b border-rule dark:border-night-rule px-4 sm:px-6 py-3 flex flex-wrap gap-3 justify-between items-center">
          <div className="flex items-center gap-4">
            {!focusMode && (
              <>
                <Link
                  href={monthParam ? `/admin?month=${monthParam}` : "/admin"}
                  className="text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk transition-colors"
                  title="Back to calendar"
                  aria-label="Back to calendar"
                >
                  <Calendar size={18} />
                </Link>
                {isNew && newPostDate && (
                  <TemplatePicker
                    value={draft.template}
                    loading={draft.templateLoading}
                    suggested={suggestPeriods(newPostDate)}
                    onChange={draft.switchTemplate}
                  />
                )}
              </>
            )}
            {focusMode && (
              <span className="text-xs text-ink-soft dark:text-chalk-muted">
                {bodyWords} words
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {message && (
              <span
                role="status"
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
              {!focusMode && !isNew && images.postImages.length > 0 && (
                <button
                  onClick={() => images.setShowImages(!images.showImages)}
                  className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 inline-flex items-center justify-center rounded-xs text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk hover:bg-paper dark:hover:bg-night-raised transition-[color,background-color,transform] active:scale-90 relative"
                  title="Manage images"
                  aria-label="Manage images"
                >
                  <ImageIcon size={18} />
                  <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-ink dark:bg-chalk rounded-full text-[8px] text-white dark:text-night flex items-center justify-center">
                    {images.postImages.length}
                  </span>
                </button>
              )}
              {!focusMode && photoDate && (
                <button
                  onClick={() => setPhotosToggle(!photosOpen)}
                  className={`min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 inline-flex items-center justify-center rounded-xs transition-[color,background-color,transform] active:scale-90 ${photosOpen && !showPreview ? "text-ink-strong bg-paper-sunken dark:text-chalk-strong dark:bg-night-raised" : "text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk hover:bg-paper dark:hover:bg-night-raised"}`}
                  title="Photos from this day"
                  aria-label="Photos from this day"
                  aria-pressed={photosOpen && !showPreview}
                >
                  <Camera size={18} />
                </button>
              )}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 inline-flex items-center justify-center rounded-xs transition-[color,background-color,transform] active:scale-90 ${showPreview ? "text-ink-strong bg-paper-sunken dark:text-chalk-strong dark:bg-night-raised" : "text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk hover:bg-paper dark:hover:bg-night-raised"}`}
                title={showPreview ? "Edit" : "Preview"}
                aria-label={showPreview ? "Edit" : "Preview"}
                aria-pressed={showPreview}
              >
                {showPreview ? <FileEdit size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              onClick={() => setFocusMode(!focusMode)}
              aria-pressed={focusMode}
              className="min-h-11 sm:min-h-9 px-2 py-1.5 text-xs text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk"
              title="Escape to leave focus mode"
            >
              {focusMode ? "Leave focus" : "Focus"}
            </button>
            {!focusMode && (
              <button
                onClick={() => setShowTools(!showTools)}
                aria-expanded={showTools}
                aria-controls="writing-tools"
                className="min-h-11 sm:min-h-9 px-2 py-1.5 text-xs text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk"
              >
                Tools
              </button>
            )}
            <button
              onClick={draft.handleSave}
              disabled={
                draft.loading ||
                draft.saving ||
                draft.publishing ||
                draft.templateLoading
              }
              className="min-h-11 sm:min-h-9 px-3 py-1.5 text-xs bg-ink text-paper dark:bg-chalk dark:text-night disabled:opacity-30 rounded-xs"
            >
              {draft.saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        {!focusMode && showTools && (
          <div
            id="writing-tools"
            className="border-b border-rule dark:border-night-rule px-6 py-3 flex flex-wrap gap-3 items-center"
          >
            {!showPreview && (
              <button
                onClick={handleFormat}
                className="px-3 py-1.5 text-xs text-ink-soft dark:text-chalk-muted hover:text-ink dark:hover:text-chalk hover:bg-paper dark:hover:bg-night-raised transition-[color,background-color,transform] active:scale-97 rounded-xs"
                title="Format markdown"
              >
                Format
              </button>
            )}
            {draft.isDraft && (
              <button
                onClick={draft.handlePublish}
                disabled={
                  draft.loading ||
                  draft.saving ||
                  draft.publishing ||
                  draft.templateLoading ||
                  images.uploading ||
                  images.showImageNameModal ||
                  isNew
                }
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
                className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 inline-flex items-center justify-center rounded-xs text-ink-soft dark:text-chalk-muted hover:text-red-600 dark:hover:text-red-500 hover:bg-paper dark:hover:bg-night-raised disabled:opacity-30 transition-[color,background-color,transform] active:scale-90"
                title="Delete post"
                aria-label="Delete post"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}
        {(!focusMode || !draft.backupAvailable) && (
          <div className="px-6 py-2 flex flex-wrap justify-between gap-2 text-xs text-ink-soft dark:text-chalk-muted">
            <span>
              {bodyWords} words · {Math.max(1, Math.ceil(bodyWords / 200))} min
              read
            </span>
            <span role="status">
              {draft.loading
                ? "Loading…"
                : draft.hasUnsavedChanges
                  ? draft.backupAvailable
                    ? "Unsaved · browser copy kept"
                    : "Unsaved · browser backup unavailable; save to file"
                  : "No unsaved changes"}
            </span>
          </div>
        )}

        {!focusMode && images.showImages && !isNew && (
          <ImageStrip
            slug={slug}
            images={images.postImages}
            onClose={() => images.setShowImages(false)}
            onDelete={images.handleDeleteImage}
          />
        )}

        {/* Editor / preview pane */}
        <div
          className={`flex-1 overflow-hidden ${focusMode ? "pb-0" : "pb-10"}`}
        >
          {showPreview ? (
            <div className="h-full overflow-y-auto p-8 admin-scrollbar">
              {(() => {
                let parsed;
                try {
                  parsed = matter(draft.markdown);
                } catch {
                  return (
                    <p role="alert">
                      Frontmatter needs fixing. Return to Edit to correct it.
                    </p>
                  );
                }
                const { data: frontmatter, content } = parsed;

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
                className={`h-full p-4 sm:p-8 transition-colors ${images.isDragging ? "bg-paper-sunken dark:bg-night-raised outline outline-1 outline-dashed outline-ink dark:outline-chalk" : ""}`}
                onDragOver={images.handleDragOver}
                onDragLeave={images.handleDragLeave}
                onDrop={images.handleDrop}
              >
                <CodeMirror
                  ref={cmRef}
                  value={draft.markdown}
                  editable={
                    !draft.loading && !draft.saving && !draft.templateLoading
                  }
                  onChange={(value) => draft.setMarkdown(value)}
                  extensions={extensions}
                  theme="none"
                  basicSetup={markdownEditorSetup}
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
        {!showPreview && !focusMode && (
          <>
            <div
              className="hidden sm:block absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize"
              onMouseDown={(e) => handleResizeStart(e, "left")}
            />
            <div
              className="hidden sm:block absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize"
              onMouseDown={(e) => handleResizeStart(e, "right")}
            />
          </>
        )}

        {!focusMode && (
          <EditorFooter
            isNew={isNew}
            date={draft.date}
            prevSlug={draft.prevSlug}
            nextSlug={draft.nextSlug}
            prevDate={draft.prevDate}
            nextDate={draft.nextDate}
            monthParam={monthParam}
          />
        )}

        {images.showImageNameModal && images.pendingImageFile && (
          <ImageCropModal
            file={images.pendingImageFile}
            name={images.imageNameInput}
            onNameChange={images.setImageNameInput}
            onConfirm={images.confirmImageUpload}
            onCancel={images.cancelImageUpload}
            uploading={images.uploading}
            error={images.uploadError}
          />
        )}

        {modalConfig && (
          <ConfirmModal
            config={modalConfig}
            onCancel={() => setModalConfig(null)}
          />
        )}
      </div>

      {!focusMode && photoDate && photosOpen && !showPreview && (
        <PhotoPanel
          date={photoDate}
          onPick={(file, name) => {
            if (!desktop) setPhotosToggle(false);
            images.openCropModalWith(file, name);
          }}
          onClose={() => setPhotosToggle(false)}
        />
      )}
    </div>
  );
}
