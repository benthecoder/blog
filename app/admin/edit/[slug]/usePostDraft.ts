"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { useRouter, useSearchParams } from "next/navigation";
import {
  FrontmatterError,
  parseMarkdown,
  stringifyFrontmatter,
} from "@/utils/content/frontmatter";
import { draftFrontmatterSchema } from "@/utils/content/schemas";
import {
  draftRecoveryKey,
  readDraftBackup,
  writeDraftBackup,
  removeDraftBackup,
} from "@/utils/content/draftRecovery";
import type { ContentKind } from "@/utils/content/kind";

import {
  publishImagePaths,
  unpublishImagePaths,
} from "@/utils/content/draftImages";
import { DEFAULT_POST_TEMPLATE } from "../post-template";
import { suggestPeriods, type PeriodKind } from "@/utils/digest/schedule";

interface UsePostDraftArgs {
  slug: string;
  kind?: ContentKind;
  isNew: boolean;
  searchParams: ReturnType<typeof useSearchParams>;
  router: ReturnType<typeof useRouter>;
  /** Show a confirm dialog; runs onConfirm after the user accepts. */
  confirmAction: (
    title: string,
    message: string,
    labels: [cancel: string, confirm: string],
    onConfirm: () => void
  ) => void;
  /** Surface a status message in the bottom bar. */
  notify: (message: string, autoClear?: boolean) => void;
  /** Normalizes markdown on explicit save/publish, applying it to the editor view. */
  formatMarkdown: (markdown: string) => string;
}

/**
 * Owns the post's content lifecycle: loading (or template init for new
 * posts), unsaved-changes tracking with localStorage draft backup,
 * save/publish/unpublish/delete, autosave for saved drafts, prev/next
 * navigation targets, and the cmd+S / leave-guard listeners.
 */
export function usePostDraft({
  slug,
  kind = "post",
  isNew,
  searchParams,
  router,
  confirmAction,
  notify,
  formatMarkdown,
}: UsePostDraftArgs) {
  const dateParam = isNew ? searchParams.get("date") : null;
  const isEssay = kind === "essay";
  // Post requests stay exactly as before; essays add a kind marker.
  const kindQuery = isEssay ? "&kind=essay" : "";
  const kindBody = isEssay ? { kind } : {};
  // Essay slugs can't collide with post recovery copies in localStorage.
  const recoverySlug = isEssay ? `essay-${slug}` : slug;
  const recoveryKey = draftRecoveryKey(recoverySlug, dateParam);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== recoveryKey;
  const latestMarkdownRef = useRef("");
  const saveInFlight = useRef(false);
  const saveSettledRef = useRef<Promise<void> | null>(null);
  const wasDirtyRef = useRef(false);
  const templateRequestRef = useRef<AbortController | null>(null);
  const formatRef = useRef(formatMarkdown);
  const autoTriedRef = useRef<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set while a delete is in flight or done, so no save recreates the file.
  const deletingRef = useRef(false);
  const [date, setDate] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [prevSlug, setPrevSlug] = useState<string | null>(null);
  const [nextSlug, setNextSlug] = useState<string | null>(null);
  const [template, setTemplate] = useState<PeriodKind | "blank">("blank");
  const [templateLoading, setTemplateLoading] = useState(false);
  const initialContentRef = useRef({ markdown: "" });

  // Replace the editor with the blank daily template or a period template
  // (sunday links / highlights / reflection) built server-side.
  async function loadTemplate(
    kind: PeriodKind | "blank",
    dateParam: string,
    formattedDate: string
  ) {
    templateRequestRef.current?.abort();
    const controller = new AbortController();
    templateRequestRef.current = controller;
    const apply = (md: string) => {
      if (controller.signal.aborted) return;
      setMarkdown(md);
      initialContentRef.current = { markdown: md };
      setTemplate(kind);
    };

    if (kind === "blank") {
      setTemplateLoading(false);
      apply(DEFAULT_POST_TEMPLATE.replace("date:", `date: ${formattedDate}`));
      return;
    }

    setTemplateLoading(true);
    try {
      const res = await fetch(
        `/api/admin/period-template?kind=${kind}&date=${dateParam}`,
        { signal: controller.signal }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      apply(
        stringifyFrontmatter(data.body, {
          title: data.title,
          format: data.format,
          tags: data.tags,
          date: formattedDate,
        })
      );
    } catch (err) {
      if (!controller.signal.aborted)
        notify(
          `✗ Template: ${err instanceof Error ? err.message : String(err)}`
        );
    } finally {
      if (!controller.signal.aborted) setTemplateLoading(false);
    }
  }

  const switchTemplate = (kind: PeriodKind | "blank") => {
    const dateParam = searchParams.get("date");
    if (!dateParam || kind === template) return;
    // loadTemplate catches its own failures and reports them through notify.
    const run = () => void loadTemplate(kind, dateParam, date);
    if (hasUnsavedChanges) {
      confirmAction(
        "replace your writing?",
        "Switching template replaces what you've typed.",
        ["keep mine", "replace"],
        run
      );
    } else {
      run();
    }
  };

  // Fetch all posts to determine prev/next for existing posts
  useEffect(() => {
    if (isNew || isEssay) return;

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
  }, [slug, isNew, isEssay]);

  // Prev/next dates for new posts: pure function of the date param
  const shiftDate = (base: string, days: number) => {
    const [year, month, day] = base.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const prevDate = dateParam ? shiftDate(dateParam, -1) : null;
  const nextDate = dateParam ? shiftDate(dateParam, 1) : null;

  // Post/template load syncs fetch + localStorage draft state into the
  // editor; inherently effect-driven.
  useEffect(() => {
    const draftKey = recoveryKey;
    const controller = new AbortController();
    setLoadedKey(null);
    setTemplateLoading(false);
    wasDirtyRef.current = false;
    deletingRef.current = false;
    setDeleting(false);
    const offerRecovery = (formattedDate: string, baseline: string) => {
      const backup =
        readDraftBackup(draftKey) ??
        (isNew ? readDraftBackup("draft-new") : null);
      if (
        !backup ||
        backup.date !== formattedDate ||
        backup.markdown === baseline
      )
        return false;
      confirmAction(
        "restore unsaved writing?",
        `This browser kept a copy from ${new Date(backup.timestamp).toLocaleString()} that was never saved to the file.`,
        ["not now", "restore"],
        () => setMarkdown(backup.markdown)
      );
      return true;
    };

    if (!isNew) {
      fetch(
        `/api/admin/get-post?slug=${encodeURIComponent(slug)}${kindQuery}`,
        {
          signal: controller.signal,
        }
      )
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Could not load post");
          return data;
        })
        .then((data) => {
          if (controller.signal.aborted) return;
          const rawContent = stringifyFrontmatter(
            data.content,
            isEssay
              ? {
                  title: data.title,
                  subtitle: data.subtitle,
                  ...(data.format ? { format: data.format } : {}),
                  date: data.date,
                  ...(data.updated ? { updated: data.updated } : {}),
                  ...(data.tags ? { tags: data.tags } : {}),
                }
              : {
                  title: data.title,
                  ...(data.format ? { format: data.format } : {}),
                  tags: data.tags,
                  date: data.date,
                }
          );
          setMarkdown(rawContent);
          setDate(data.date);
          setIsDraft(data.isDraft ?? false);
          initialContentRef.current = { markdown: rawContent };
          offerRecovery(data.date, rawContent);
          setLoadedKey(recoveryKey);
        })
        .catch((err) => {
          if (!controller.signal.aborted)
            notify(`✗ Load failed: ${err.message}`);
        });
    } else {
      const newDateParam = dateParam;
      if (newDateParam) {
        const [year, month, day] = newDateParam.split("-");
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
        // Baseline is the untouched template, not "" — otherwise a fresh
        // new-post page reports unsaved changes before any typing happens.
        initialContentRef.current = { markdown: templateWithDate };

        const hasSavedDraft = offerRecovery(formattedDate, templateWithDate);
        setLoadedKey(recoveryKey);

        // Sundays, month ends and quarter ends open with their own template
        // (unless a saved draft is waiting to be restored).
        const suggested = hasSavedDraft
          ? undefined
          : suggestPeriods(dateObj)[0];
        // Fire and forget: loadTemplate reports its own failures via notify.
        if (suggested)
          void loadTemplate(suggested, newDateParam, formattedDate);
      } else {
        setMarkdown(DEFAULT_POST_TEMPLATE);
        initialContentRef.current = { markdown: DEFAULT_POST_TEMPLATE };
        offerRecovery("", DEFAULT_POST_TEMPLATE);
        setLoadedKey(recoveryKey);
      }
    }
    return () => {
      controller.abort();
      templateRequestRef.current?.abort();
    };
    // confirmAction/notify are page-level helpers, not load triggers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isNew, isEssay, kindQuery, dateParam, recoveryKey]);

  const saveMarkdown = useCallback(
    async (toSave: string, auto: boolean) => {
      saveInFlight.current = true;
      let settleSave: () => void = () => {};
      saveSettledRef.current = new Promise<void>((resolve) => {
        settleSave = resolve;
      });
      setSaving(true);
      if (!auto) notify("");

      try {
        // Throws a FrontmatterError naming the bad field; caught below.
        const { data: frontmatter, content } = parseMarkdown(
          toSave,
          draftFrontmatterSchema,
          "frontmatter"
        );

        const parsedTitle = (frontmatter.title ?? "").trim();
        const parsedTags = (frontmatter.tags ?? "").trim();
        const parsedDate = (frontmatter.date || date).trim();

        let slugToUse = slug;

        if (isNew) {
          const newDateParam = searchParams.get("date");
          if (newDateParam) {
            const [year, month, day] = newDateParam.split("-");
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
            ...(frontmatter.format != null
              ? { format: frontmatter.format }
              : {}),
            date: parsedDate,
            content: content,
            isNew,
            ...(isEssay
              ? {
                  ...kindBody,
                  subtitle: (frontmatter.subtitle ?? "").trim(),
                  updated: frontmatter.updated ?? "",
                }
              : {}),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          if (!auto) notify("✓ Saved!", true);
          setHasUnsavedChanges(latestMarkdownRef.current !== toSave);
          setIsDraft(data.isDraft ?? isDraft);
          setSavedFlash(true);
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
          savedTimerRef.current = setTimeout(() => setSavedFlash(false), 2000);

          if (latestMarkdownRef.current === toSave) {
            removeDraftBackup(
              draftRecoveryKey(recoverySlug, searchParams.get("date"))
            );
            removeDraftBackup(`draft-${slugToUse}`);
            if (isNew) {
              const legacy = readDraftBackup("draft-new");
              if (legacy?.date === date) removeDraftBackup("draft-new");
            }
          }
          initialContentRef.current = { markdown: toSave };

          if (latestMarkdownRef.current !== toSave) {
            notify("✓ Saved earlier version; newer edits still need saving");
            return false;
          }
          if (isNew) {
            router.push(`/admin/edit/${data.slug}`);
          }
          return true;
        } else {
          notify(`✗ Error: ${data.error}`);
        }
      } catch (error) {
        notify(
          error instanceof FrontmatterError
            ? `✗ Frontmatter: ${error.detail}`
            : `✗ Error: ${String(error)}`
        );
      } finally {
        saveInFlight.current = false;
        settleSave();
        saveSettledRef.current = null;
        setSaving(false);
      }
      return false;
    },
    // kindBody is derived from isEssay; notify is a page-level helper
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slug, isNew, isEssay, recoverySlug, searchParams, date, router, isDraft]
  );

  // Stable identity per markdown: dep of the cmd+S keydown effect below.
  // Explicit saves format first; autosave leaves the text alone so it can't
  // fight the cursor mid-typing.
  const handleSave = useCallback(
    async (options?: { auto?: boolean }) => {
      if (loading || templateLoading || saveInFlight.current) return false;
      if (deletingRef.current) return false;
      const auto = options?.auto ?? false;
      const toSave = auto ? markdown : formatRef.current(markdown);
      if (toSave !== markdown) {
        latestMarkdownRef.current = toSave;
        setMarkdown(toSave);
      }
      return saveMarkdown(toSave, auto);
    },
    [markdown, loading, templateLoading, saveMarkdown]
  );

  // Publish/unpublish rewrite image URLs in the file; mirror that in the
  // editor so the next save doesn't write the old URLs back.
  const rewriteImagePaths = (rewrite: (markdown: string) => string) => {
    initialContentRef.current = {
      markdown: rewrite(initialContentRef.current.markdown),
    };
    const next = rewrite(latestMarkdownRef.current);
    if (next !== latestMarkdownRef.current) {
      latestMarkdownRef.current = next;
      setMarkdown(next);
    }
  };

  const handlePublish = async () => {
    if (loading || saving || publishing || isNew) return false;
    // Publishing must stop when the preceding save fails. Always saves so
    // the published file is formatted even when autosave already ran.
    if (!(await handleSave())) return false;

    setPublishing(true);
    notify("");

    try {
      let slugToUse = slug;
      if (isNew) {
        const newDateParam = searchParams.get("date");
        if (newDateParam) {
          const [year, month, day] = newDateParam.split("-");
          const yy = year.substring(2);
          slugToUse = `${day}${month}${yy}`;
        }
      }

      const response = await fetch("/api/admin/publish-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slugToUse, ...kindBody }),
      });

      const data = await response.json();

      if (response.ok) {
        notify("✓ Published!", true);
        rewriteImagePaths(publishImagePaths);
        setIsDraft(false);
        return true;
      } else {
        notify(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      notify(`✗ Error: ${String(error)}`);
    } finally {
      setPublishing(false);
    }
    return false;
  };

  const handleUnpublish = async () => {
    setPublishing(true);
    notify("");

    try {
      const response = await fetch("/api/admin/unpublish-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...kindBody }),
      });

      const data = await response.json();

      if (response.ok) {
        notify("✓ Moved to drafts", true);
        rewriteImagePaths((md) => unpublishImagePaths(md, slug));
        setIsDraft(true);
      } else {
        notify(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      notify(`✗ Error: ${String(error)}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = () => {
    if (loading || publishing || templateLoading || deletingRef.current) return;
    confirmAction(
      isEssay ? "delete this essay?" : "delete this post?",
      "The file is removed and this can't be undone.",
      ["keep", "delete"],
      async () => {
        deletingRef.current = true;
        setDeleting(true);
        notify("");

        let deleted = false;
        try {
          // A request already on the wire must finish before deleting its file.
          await saveSettledRef.current;
          const response = await fetch(
            `/api/admin/delete-post?slug=${encodeURIComponent(slug)}${kindQuery}`,
            { method: "DELETE" }
          );

          const data = await response.json();

          if (response.ok) {
            removeDraftBackup(recoveryKey);
            notify(isEssay ? "✓ Essay deleted" : "✓ Post deleted");
            deleted = true;
            initialContentRef.current = { markdown: latestMarkdownRef.current };
            wasDirtyRef.current = false;
            setHasUnsavedChanges(false);
            router.replace(
              data.nextHref || (isEssay ? "/admin/essays" : "/admin")
            );
          } else {
            deletingRef.current = false;
            notify(`✗ Error: ${data.error}`);
          }
        } catch (error) {
          deletingRef.current = false;
          notify(`✗ Error: ${String(error)}`);
        } finally {
          if (!deleted) {
            deletingRef.current = false;
            setDeleting(false);
          }
        }
      }
    );
  };

  // Track unsaved changes + back up the draft to localStorage
  useEffect(() => {
    latestMarkdownRef.current = markdown;
    if (loading || deletingRef.current) return;
    const hasChanged = markdown !== initialContentRef.current.markdown;
    setHasUnsavedChanges(hasChanged);

    if (hasChanged) {
      const draftKey = recoveryKey;
      const draft = {
        markdown,
        timestamp: Date.now(),
        date,
      };
      writeDraftBackup(draftKey, draft);
    } else if (wasDirtyRef.current) {
      // Undone back to the saved text: the copy no longer holds anything.
      removeDraftBackup(recoveryKey);
    }
    wasDirtyRef.current = hasChanged;
  }, [markdown, recoveryKey, date, loading]);

  useEffect(() => {
    formatRef.current = formatMarkdown;
  });

  useEffect(
    () => () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    },
    []
  );

  // Autosave saved drafts 2s after the last edit. Never new files (that would
  // create one just by opening a day) and never live posts (explicit update).
  // Each distinct text is tried once, so a failing save doesn't loop.
  useEffect(() => {
    if (isNew || !isDraft || !hasUnsavedChanges) return;
    if (loading || templateLoading || saving || publishing) return;
    if (autoTriedRef.current === markdown) return;
    const timer = setTimeout(() => {
      autoTriedRef.current = markdown;
      void handleSave({ auto: true });
    }, 2000);
    return () => clearTimeout(timer);
  }, [
    isNew,
    isDraft,
    hasUnsavedChanges,
    loading,
    templateLoading,
    saving,
    publishing,
    markdown,
    handleSave,
  ]);

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

  // Intercept in-app link clicks while there are unsaved changes
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      // New-tab links (e.g. "view on site") don't leave the editor.
      if (
        anchor &&
        anchor.href &&
        anchor.target !== "_blank" &&
        !anchor.href.includes("#")
      ) {
        e.preventDefault();
        e.stopPropagation();

        confirmAction(
          "leave without saving?",
          "Your unsaved changes stay in this browser's copy, not the file.",
          ["stay", "leave"],
          () => {
            // Temporarily disable beforeunload warning before navigating
            setHasUnsavedChanges(false);
            setTimeout(() => {
              window.location.href = anchor.href;
            }, 0);
          }
        );
      }
    };

    if (hasUnsavedChanges) {
      document.addEventListener("click", handleClick, true);
      return () => document.removeEventListener("click", handleClick, true);
    }
    // confirmAction is a page-level helper, not a re-subscription trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsavedChanges]);

  // cmd+S / ctrl+S saves
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        // handleSave reports failures through notify and never rejects.
        void handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  return {
    date,
    loading,
    markdown,
    setMarkdown,
    saving,
    publishing,
    deleting,
    hasUnsavedChanges,
    savedFlash,
    isDraft,
    template,
    templateLoading,
    switchTemplate,
    prevSlug,
    nextSlug,
    prevDate,
    nextDate,
    handleSave,
    handlePublish,
    handleUnpublish,
    handleDelete,
  };
}
