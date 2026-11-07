"use client";

import {
  useState,
  useRef,
  useMemo,
  useEffect,
  useSyncExternalStore,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import RenderPost from "@/components/posts/RenderPost";
import MarkdownPreview from "@/components/posts/MarkdownPreview";
import { FrontmatterError, parseMarkdown } from "@/utils/content/frontmatter";
import { draftFrontmatterSchema } from "@/utils/content/schemas";
import { ArrowLeft, Calendar, Camera } from "lucide-react";
import { useTheme } from "next-themes";
import { useMounted } from "@/components/ui/ThemeSwitch";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import type { ContentKind } from "@/utils/content/kind";
import { essayProseClasses } from "@/components/essays/essayProse";
import { formatEssayDate } from "@/utils/content/essayDate";
import { usePostDraft } from "./usePostDraft";
import { useImageManager } from "./useImageManager";
import { ConfirmModal, type ConfirmConfig } from "./ConfirmModal";
import { ImageCropModal } from "./ImageCropModal";
import { ImageStrip } from "./ImageStrip";
import { DraftNavigation } from "./DraftNavigation";
import { ShortcutsSheet } from "./ShortcutsSheet";
import { PhotoPanel } from "./PhotoPanel";
import { WordLookup, wordSelection, type WordSelection } from "./WordLookup";
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
import { postEditorExtensions } from "@/components/admin/postEditorExtensions";
import { Button } from "@/components/ui/Button";
import { dayHref, monthHref, monthOf } from "@/utils/adminDayNav";
import { readStoredString, writeStoredString } from "@/utils/browserStorage";

const widths = [
  { label: "narrow", cls: "max-w-[620px]" },
  { label: "default", cls: "max-w-[760px]" },
  { label: "wide", cls: "max-w-[960px]" },
];
const widthKey = "editor-width";

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

export function Editor({ kind = "post" }: { kind?: ContentKind }) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const isEssay = kind === "essay";
  const isNew = !isEssay && slug === "new";

  const desktop = useSyncExternalStore(
    subscribeToDesktop,
    isDesktop,
    serverDesktop
  );
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [photosOpen, setPhotosOpen] = useState<boolean | null>(null);
  const [modalConfig, setModalConfig] = useState<ConfirmConfig | null>(null);
  const [lookup, setLookup] = useState<WordSelection | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [widthIndex, setWidthIndex] = useState(1);
  const calendarLinkRef = useRef<HTMLAnchorElement>(null);
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();

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

  // Explicit saves and publish run formatDraft. It goes through the
  // view as a minimal edit so ⌘Z undoes it and the cursor stays put.
  const formatMarkdown = (markdown: string) => {
    const formatted = formatDraft(markdown);
    const view = cmRef.current?.view;
    if (formatted === markdown || !view) return formatted;
    const next = formatted;
    const current = view.state.doc.toString();
    let from = 0;
    while (
      from < current.length &&
      from < next.length &&
      current[from] === next[from]
    )
      from++;
    let end = current.length;
    let nextEnd = next.length;
    while (
      end > from &&
      nextEnd > from &&
      current[end - 1] === next[nextEnd - 1]
    ) {
      end--;
      nextEnd--;
    }
    if (end > from || nextEnd > from)
      view.dispatch({
        changes: { from, to: end, insert: next.slice(from, nextEnd) },
      });
    return formatted;
  };

  const draft = usePostDraft({
    slug,
    kind,
    isNew,
    searchParams,
    router,
    confirmAction,
    notify,
    formatMarkdown,
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
      ...postEditorExtensions,
      imageInsertionPoint,
      EditorView.updateListener.of((update) => {
        if (update.selectionSet || update.focusChanged)
          setLookup(wordSelection(update));
      }),
      EditorView.contentAttributes.of({
        "aria-label": isEssay ? "Essay Markdown" : "Post Markdown",
        spellcheck: "true",
        autocorrect: "on",
        autocapitalize: "sentences",
      }),
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
    // isEssay never changes for a mounted editor; keep the array stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const monthParam = searchParams.get("month");

  // The post's day: DDMMYY slug, else the new-post date param, else
  // whatever date the loaded post carries.
  const dayDate = useMemo(() => {
    if (isEssay) return null;
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
  }, [slug, isNew, isEssay, searchParams, draft.date]);
  // The PhotoKit helper only runs locally; the photo routes 404 in production.
  const photoDate = process.env.NODE_ENV === "production" ? null : dayDate;
  const showPhotos = Boolean(
    photoDate && !showPreview && !focusMode && (photosOpen ?? desktop)
  );

  const bodyWords = useMemo(() => {
    // Count the writing, not frontmatter or Markdown image destinations.
    const text = draft.markdown
      .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[`#*>_~|]/g, "")
      .trim();
    return text ? text.split(/\s+/).length : 0;
  }, [draft.markdown]);

  const busy =
    draft.loading ||
    draft.saving ||
    draft.publishing ||
    draft.templateLoading ||
    images.uploading ||
    images.showImageNameModal;
  const publishing = draft.isDraft && !isNew;
  const runPrimary = () =>
    publishing ? void draft.handlePublish() : void draft.handleSave();

  useEffect(() => {
    const stored = widths.findIndex(
      (width) => width.label === readStoredString(widthKey)
    );
    // Stored after hydration so the server and first client render agree.
    if (stored >= 0) setWidthIndex(stored);
  }, []);
  const cycleWidth = () => {
    const next = (widthIndex + 1) % widths.length;
    setWidthIndex(next);
    writeStoredString(widthKey, widths[next].label);
  };

  const setFocus = (on: boolean) => {
    setFocusMode(on);
    if (on) {
      setShowPreview(false);
      setPhotosOpen(false);
    }
  };

  // Day and month steps share the unsaved-changes guard with link clicks.
  const step = async (unit: "day" | "month", direction: -1 | 1) => {
    if (isEssay) return;
    if (unit === "day" && !isNew) {
      const target = direction < 0 ? draft.prevSlug : draft.nextSlug;
      if (target) draft.leaveTo(`/admin/edit/${target}`);
      return;
    }
    let slugs: string[] = [];
    try {
      const response = await fetch("/api/admin/list-posts");
      if (response.ok) slugs = await response.json();
    } catch {
      return;
    }
    if (unit === "month") {
      if (dayDate) draft.leaveTo(monthHref(dayDate, direction, slugs));
      return;
    }
    const target = direction < 0 ? draft.prevDate : draft.nextDate;
    if (target) draft.leaveTo(dayHref(target, slugs));
  };

  // Latest-render handler behind one stable listener. Capture phase so the
  // editor's own ⌘Enter / ⌘[ / ⌘] bindings don't swallow these first.
  const onKeyRef = useRef<(event: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    onKeyRef.current = (event) => {
      if (document.querySelector("dialog[open], [role=dialog]")) return;
      if (event.key === "Escape") {
        if (focusMode) {
          event.preventDefault();
          event.stopPropagation();
          setFocusMode(false);
          return;
        }
        setPhotosOpen(false);
        return;
      }
      if (event.key === "?" && !event.metaKey && !event.ctrlKey) {
        const target = event.target as HTMLElement | null;
        if (!target?.closest("input, textarea, select, [contenteditable]")) {
          event.preventDefault();
          setShowShortcuts(true);
        }
        return;
      }
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      const claim = () => {
        event.preventDefault();
        event.stopPropagation();
      };
      if (key === "enter" && event.shiftKey) {
        claim();
        setFocus(!focusMode);
      } else if (key === "enter") {
        claim();
        if (!busy) runPrimary();
      } else if (key === "p" && event.shiftKey) {
        claim();
        setShowPreview((value) => !value);
      } else if (key === "/") {
        claim();
        setShowShortcuts(true);
      } else if (key === "\\") {
        claim();
        cycleWidth();
      } else if (key === ".") {
        claim();
        // Click the link so the unsaved-changes guard still applies.
        calendarLinkRef.current?.click();
      } else if (["[", "]", "{", "}"].includes(key) && !isEssay) {
        claim();
        // Shift turns [ ] into { } on US layouts; shift steps a month.
        void step(
          event.shiftKey ? "month" : "day",
          key === "[" || key === "{" ? -1 : 1
        );
      }
    };
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyRef.current(event);
    window.addEventListener("keydown", listener, true);
    return () => window.removeEventListener("keydown", listener, true);
  }, []);

  const menuItemCls =
    "block w-full px-3 py-2 text-left rounded-xs hover:bg-paper-sunken dark:hover:bg-night disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent";
  const primaryActive = isNew || publishing || draft.hasUnsavedChanges;
  const primaryLabel = publishing
    ? draft.publishing
      ? "publishing…"
      : "publish"
    : draft.saving
      ? "saving…"
      : isNew
        ? "save"
        : "update";
  const backHref = isEssay
    ? "/admin/essays"
    : (dayDate ? monthOf(dayDate) : monthParam)
      ? `/admin?month=${dayDate ? monthOf(dayDate) : monthParam}`
      : "/admin";
  const status = draft.loading
    ? "loading…"
    : images.uploading
      ? "uploading…"
      : draft.saving
        ? "saving…"
        : draft.hasUnsavedChanges
          ? "unsaved"
          : "saved";

  const saveStatus = message ? (
    <span
      role="status"
      className={message.includes("✓") ? "text-success" : "text-danger"}
    >
      {message}
    </span>
  ) : (
    <span
      role="status"
      className={`transition-opacity duration-700 ${status === "saved" && !draft.savedFlash ? "opacity-0" : "opacity-100"}`}
    >
      {status}
    </span>
  );
  const wordCount = <span className="tabular-nums">{bodyWords} words</span>;

  return (
    <div className={`h-dvh bg-surface ${showPhotos ? "lg:pr-72" : ""}`}>
      <div
        className={`editor-column mx-auto w-full h-full min-w-0 flex flex-col relative ${widths[widthIndex].cls} sm:border-x border-line`}
      >
        {/* Top bar */}
        <div
          className={`${focusMode ? "hidden" : "flex"} min-h-14 shrink-0 border-b border-line px-4 sm:px-6 py-2 flex-wrap gap-3 justify-between items-center`}
        >
          <div className="flex items-center gap-4">
            <Link
              ref={calendarLinkRef}
              href={backHref}
              className="text-ink-soft dark:text-chalk-muted hover:text-accent transition-colors"
              title={`${isEssay ? "Back to essays" : "Back to calendar"} (⌘.)`}
              aria-label={isEssay ? "Back to essays" : "Back to calendar"}
            >
              {isEssay ? <ArrowLeft size={18} /> : <Calendar size={18} />}
            </Link>
            {!isNew && (
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft dark:text-chalk-muted">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${draft.isDraft ? "bg-muted" : "bg-success"}`}
                />
                {draft.isDraft ? "draft" : "live"}
              </span>
            )}
            {isNew && newPostDate && (
              <TemplatePicker
                value={draft.template}
                loading={draft.templateLoading}
                suggested={suggestPeriods(newPostDate)}
                onChange={draft.switchTemplate}
              />
            )}
          </div>

          <EditorPopover
            plain
            align="end"
            label="⋯"
            name={isEssay ? "More essay actions" : "More post actions"}
          >
            {(close) => (
              <div className="text-xs">
                <button
                  type="button"
                  onClick={() => {
                    close();
                    setShowPreview(!showPreview);
                  }}
                  className={menuItemCls}
                >
                  {showPreview ? "edit" : "preview"}{" "}
                  <span className="float-right text-muted">⌘⇧P</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    setFocus(true);
                    cmRef.current?.view?.focus();
                  }}
                  className={menuItemCls}
                >
                  focus mode <span className="float-right text-muted">⌘⇧↵</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    cycleWidth();
                  }}
                  className={menuItemCls}
                >
                  width: {widths[widthIndex].label}{" "}
                  <span className="float-right text-muted">⌘\</span>
                </button>
                {mounted && (
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      setTheme(resolvedTheme === "dark" ? "light" : "dark");
                    }}
                    className={menuItemCls}
                  >
                    {resolvedTheme === "dark"
                      ? "light appearance"
                      : "dark appearance"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    close();
                    setShowShortcuts(true);
                  }}
                  className={menuItemCls}
                >
                  shortcuts <span className="float-right text-muted">⌘/</span>
                </button>
                {!isNew && !draft.isDraft && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        close();
                        void draft.handleUnpublish();
                      }}
                      className={menuItemCls}
                    >
                      move to drafts
                    </button>
                    <a
                      href={`${isEssay ? "/essays" : "/posts"}/${slug}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={close}
                      className={menuItemCls}
                    >
                      view on site <span aria-hidden="true">↗</span>
                    </a>
                  </>
                )}
                {!isNew && images.postImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      images.setShowImages(!images.showImages);
                    }}
                    className={menuItemCls}
                  >
                    images ({images.postImages.length})
                  </button>
                )}
                {!isNew && (
                  <div className="mt-1 pt-1 border-t border-line">
                    <button
                      type="button"
                      disabled={draft.deleting}
                      onClick={() => {
                        close();
                        draft.handleDelete();
                      }}
                      className={`focus-ring ${menuItemCls} text-muted hover:text-accent`}
                    >
                      {draft.deleting ? "deleting…" : "delete…"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </EditorPopover>
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
        <div className="flex-1 min-h-0 relative">
          <div
            className="h-full overflow-y-auto [scrollbar-width:none]"
            onScroll={() => setLookup(null)}
          >
            {showPreview ? (
              <div className="p-8">
                {(() => {
                  let parsed;
                  try {
                    parsed = parseMarkdown(
                      draft.markdown,
                      draftFrontmatterSchema,
                      "frontmatter"
                    );
                  } catch (error) {
                    return (
                      <p role="alert" className="whitespace-pre-line">
                        Frontmatter needs fixing. Return to Edit to correct it.
                        {error instanceof FrontmatterError &&
                          `\n\n${error.detail}`}
                      </p>
                    );
                  }
                  const { data: frontmatter, content } = parsed;

                  if (isEssay) {
                    const date = formatEssayDate(
                      frontmatter.date || draft.date
                    );
                    return (
                      <div className="mx-auto max-w-[65ch]">
                        <header className="mb-10">
                          <h1 className="text-2xl font-bold lowercase leading-tight tracking-tight text-balance text-primary md:text-4xl">
                            {frontmatter.title || "Untitled"}
                          </h1>
                          {frontmatter.subtitle ? (
                            <p className="mt-3 text-base text-secondary">
                              {frontmatter.subtitle}
                            </p>
                          ) : null}
                          {date && (
                            <p className="mt-3 text-xs text-ink-soft/80 dark:text-chalk-muted">
                              {date}
                            </p>
                          )}
                        </header>
                        <article className={essayProseClasses}>
                          <MarkdownPreview content={content} />
                        </article>
                      </div>
                    );
                  }

                  const post = {
                    data: {
                      title: frontmatter.title || "Untitled",
                      tags: frontmatter.tags || "",
                      date: frontmatter.date || draft.date,
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
              <div
                className={`px-4 sm:px-8 pt-10 min-h-full transition-colors ${images.isDragging ? "bg-paper-sunken dark:bg-night-raised outline outline-1 outline-dashed outline-accent" : ""}`}
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
                    isEssay
                      ? "---\ntitle: \nsubtitle: \ndate: \n---\n\nWrite your essay here..."
                      : "---\ntitle: \ntags: \ndate: \n---\n\nWrite your content here..."
                  }
                  className="w-full text-primary"
                />
              </div>
            )}
          </div>
          {images.isDragging && !showPreview && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-2xl text-accent font-light tracking-wide">
                Drop images here
              </div>
            </div>
          )}
        </div>

        {/* One footer: word count and save status, then the one primary action. */}
        <div
          className={`${focusMode ? "hidden" : "flex"} shrink-0 min-h-14 border-t border-line px-4 sm:px-6 py-1.5 items-center justify-between gap-4 text-xs text-ink-soft dark:text-chalk-muted`}
        >
          {!isEssay && !isNew ? (
            <DraftNavigation
              words={wordCount}
              saveStatus={saveStatus}
              slug={slug}
              date={draft.date}
              isDraft={draft.isDraft}
              dirty={draft.hasUnsavedChanges}
              disabled={
                draft.loading ||
                draft.saving ||
                draft.publishing ||
                draft.deleting ||
                images.uploading
              }
              onSave={() => void draft.handleSave()}
              onNext={async (nextSlug) => {
                if (draft.isDraft) {
                  if (!(await draft.handlePublish())) return;
                } else if (
                  draft.hasUnsavedChanges &&
                  !(await draft.handleSave())
                ) {
                  return;
                }
                router.push(
                  nextSlug
                    ? `/admin/edit/${encodeURIComponent(nextSlug)}`
                    : "/admin"
                );
              }}
            />
          ) : (
            <>
              {wordCount}
              <div className="flex items-center gap-3">
                {saveStatus}
                <Button
                  size="sm"
                  variant={primaryActive ? "solid" : "outline"}
                  onClick={runPrimary}
                  disabled={busy}
                  title={`${publishing ? "publish" : isNew ? "save" : "update"} (⌘⏎)`}
                >
                  {primaryLabel}
                </Button>
              </div>
            </>
          )}
        </div>

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

        {lookup && !showPreview && !focusMode && (
          <WordLookup
            key={`${lookup.word}:${lookup.x}:${lookup.y}`}
            selection={lookup}
          />
        )}

        {showShortcuts && (
          <ShortcutsSheet
            primary={publishing ? "publish" : isNew ? "save" : "update"}
            isEssay={isEssay}
            onClose={() => setShowShortcuts(false)}
          />
        )}

        {modalConfig && (
          <ConfirmModal
            config={modalConfig}
            onCancel={() => setModalConfig(null)}
          />
        )}
      </div>

      {focusMode && (
        <button
          type="button"
          onClick={() => setFocus(false)}
          className="focus-ring fixed bottom-3 left-3 z-20 min-h-9 px-3 text-xs text-ink-soft dark:text-chalk-muted opacity-40 hover:opacity-100 focus-visible:opacity-100 bg-surface rounded-xs"
          title="Exit focus mode (Esc)"
        >
          exit focus · esc
        </button>
      )}

      {photoDate && !showPreview && !focusMode && !showPhotos && (
        <button
          type="button"
          onClick={() => setPhotosOpen(true)}
          className="focus-ring fixed right-0 top-24 z-20 inline-flex flex-col items-center gap-2 rounded-l-xs border border-r-0 border-line bg-surface px-1.5 py-3 text-ink-soft dark:text-chalk-muted hover:text-accent transition-colors"
          title="photos from this day"
          aria-label="Photos from this day"
        >
          <Camera size={16} />
        </button>
      )}

      {photoDate && showPhotos && (
        <>
          {!desktop && (
            // The drawer covers the text on narrow screens; tapping the rest
            // of the page closes it.
            <button
              type="button"
              aria-label="Close photos"
              onClick={() => setPhotosOpen(false)}
              className="focus-ring fixed inset-0 z-20 bg-night/20"
            />
          )}
          <PhotoPanel
            key={photoDate}
            date={photoDate}
            onPick={(file, name) => {
              if (!desktop) setPhotosOpen(false);
              images.openCropModalWith(file, name);
            }}
            onClose={() => setPhotosOpen(false)}
          />
        </>
      )}
    </div>
  );
}
