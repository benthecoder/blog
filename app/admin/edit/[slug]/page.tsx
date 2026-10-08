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
import { parseFrontmatter } from "@/utils/content/frontmatter";
import { Calendar, Camera, Eye, FileEdit, ImageIcon } from "lucide-react";
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
import { EditorPopover } from "@/components/admin/EditorPopover";
import { suggestPeriods } from "@/utils/digest/schedule";
import {
  asBlock,
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
    labels: ConfirmConfig["labels"],
    onConfirm: () => void
  ) => {
    setModalConfig({
      title,
      message: confirmMessage,
      labels,
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

  const insertMarkdown = (image: string) => {
    const view = cmRef.current?.view;
    if (view) {
      const { doc } = view.state;
      const pos =
        view.state.field(imageInsertionPoint) ?? view.state.selection.main.head;
      const snippet = asBlock(
        image,
        doc.sliceString(Math.max(0, pos - 2), pos),
        doc.sliceString(pos, pos + 2)
      );
      view.dispatch({
        changes: { from: pos, insert: snippet },
        selection: { anchor: pos + snippet.length },
        effects: setImageInsertion.of(null),
      });
      view.focus();
    } else {
      draft.setMarkdown(draft.markdown + "\n\n" + image + "\n");
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
      // Let dialogs and popovers handle their own Escape first.
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (document.querySelector("dialog[open], [role=dialog]")) return;
      setFocusMode(false);
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
          maxWidth:
            desktop && photoDate && photosOpen && !showPreview && !focusMode
              ? "calc(100vw - 20rem)"
              : "100vw",
          height: "100dvh",
        }}
        className={`shrink-0 min-w-0 flex flex-col relative group transition-[width] duration-200 ${focusMode ? "" : "border-l border-r border-rule dark:border-night-rule"}`}
      >
        {/* Top bar */}
        <div
          className={`min-h-14 border-b px-4 sm:px-6 py-2 flex flex-wrap gap-3 justify-between items-center ${
            focusMode
              ? "border-transparent opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
              : "border-rule dark:border-night-rule"
          }`}
        >
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
                {!isNew && (
                  <EditorPopover
                    label={draft.isDraft ? "draft" : "live"}
                    name="Post status and publishing"
                  >
                    {(close) => (
                      <div className="text-sm">
                        <p className="px-2 pb-2 text-[11px] text-ink-muted dark:text-chalk-muted">
                          {draft.isDraft ? "saved draft" : "published post"}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            close();
                            if (draft.isDraft) void draft.handlePublish();
                            else void draft.handleUnpublish();
                          }}
                          disabled={
                            draft.loading ||
                            draft.saving ||
                            draft.publishing ||
                            draft.templateLoading ||
                            images.uploading ||
                            images.showImageNameModal
                          }
                          className="w-full px-2 py-3 text-left hover:bg-paper-sunken dark:hover:bg-night disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-ink dark:focus-visible:outline-chalk"
                        >
                          {draft.publishing
                            ? "working…"
                            : draft.isDraft
                              ? "publish"
                              : "move to drafts"}
                        </button>
                        {!draft.isDraft && (
                          <a
                            href={`/posts/${slug}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={close}
                            className="block w-full px-2 py-3 text-left hover:bg-paper-sunken dark:hover:bg-night focus-visible:outline-2 focus-visible:outline-ink dark:focus-visible:outline-chalk"
                          >
                            view on site <span aria-hidden="true">↗</span>
                          </a>
                        )}
                        <div className="mt-2 pt-2 border-t border-rule dark:border-night-rule">
                          <button
                            type="button"
                            disabled={draft.deleting}
                            onClick={() => {
                              close();
                              void draft.handleDelete();
                            }}
                            className="w-full px-2 py-3 text-left text-ink-muted dark:text-chalk-muted hover:text-ink dark:hover:text-chalk disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-ink dark:focus-visible:outline-chalk"
                          >
                            {draft.deleting ? "deleting…" : "delete…"}
                          </button>
                        </div>
                      </div>
                    )}
                  </EditorPopover>
                )}
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
                uploading…
              </span>
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
              title={
                focusMode ? "esc to leave" : "hide everything but the text"
              }
            >
              {focusMode ? "leave focus" : "focus"}
            </button>
            <button
              onClick={draft.handleSave}
              disabled={
                draft.loading ||
                draft.saving ||
                draft.publishing ||
                draft.templateLoading
              }
              title="Save (⌘S)"
              className={`min-h-11 sm:min-h-9 px-3 py-1.5 text-xs rounded-xs border disabled:opacity-30 ${
                isNew || draft.hasUnsavedChanges
                  ? "bg-ink text-paper border-ink dark:bg-chalk dark:text-night dark:border-chalk"
                  : "border-rule text-ink-soft hover:text-ink dark:border-night-rule dark:text-chalk-muted dark:hover:text-chalk"
              }`}
            >
              {draft.saving ? "saving…" : "save"}
            </button>
          </div>
        </div>
        {(!focusMode || !draft.backupAvailable) && (
          <div className="px-6 py-2 flex flex-wrap justify-between gap-2 text-xs text-ink-soft dark:text-chalk-muted">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                {bodyWords} words · {Math.max(1, Math.ceil(bodyWords / 200))}{" "}
                min read
              </span>
              {!focusMode && !showPreview && (
                <button
                  type="button"
                  onClick={handleFormat}
                  aria-label="Format markdown"
                  disabled={
                    draft.loading || draft.saving || draft.templateLoading
                  }
                  className="underline decoration-dotted underline-offset-4 hover:decoration-solid hover:text-ink dark:hover:text-chalk disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-ink dark:focus-visible:outline-chalk"
                >
                  format
                </button>
              )}
            </div>
            <span role="status">
              {draft.loading
                ? "loading…"
                : draft.hasUnsavedChanges
                  ? draft.backupAvailable
                    ? "unsaved · browser copy kept"
                    : "unsaved · no browser copy, save to keep it"
                  : ""}
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
                  parsed = parseFrontmatter(draft.markdown);
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
                  editable={!draft.loading && !draft.templateLoading}
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
        <>
          {!desktop && (
            // The drawer covers the text on narrow screens; tapping the rest
            // of the page closes it.
            <button
              type="button"
              aria-label="Close photos"
              onClick={() => setPhotosToggle(false)}
              className="fixed inset-0 z-20 bg-black/20"
            />
          )}
          <PhotoPanel
            key={photoDate}
            date={photoDate}
            onPick={(file, name) => {
              if (!desktop) setPhotosToggle(false);
              images.openCropModalWith(file, name);
            }}
            onClose={() => setPhotosToggle(false)}
          />
        </>
      )}
    </div>
  );
}
