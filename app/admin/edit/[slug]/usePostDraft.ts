"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { useRouter, useSearchParams } from "next/navigation";
import matter from "gray-matter";
import {
  draftRecoveryKey,
  readDraftBackup,
  writeDraftBackup,
  removeDraftBackup,
} from "@/utils/content/draftRecovery";
import { DEFAULT_POST_TEMPLATE } from "../post-template";
import { suggestPeriods, type PeriodKind } from "@/utils/digest/schedule";

interface UsePostDraftArgs {
  slug: string;
  isNew: boolean;
  searchParams: ReturnType<typeof useSearchParams>;
  router: ReturnType<typeof useRouter>;
  /** Show a confirm dialog; runs onConfirm after the user accepts. */
  confirmAction: (
    title: string,
    message: string,
    onConfirm: () => void
  ) => void;
  /** Surface a status message in the top bar. */
  notify: (message: string, autoClear?: boolean) => void;
}

/**
 * Owns the post's content lifecycle: loading (or template init for new
 * posts), unsaved-changes tracking with localStorage draft backup,
 * save/publish/unpublish/delete, prev/next navigation targets, and the
 * cmd+S / leave-guard listeners.
 */
export function usePostDraft({
  slug,
  isNew,
  searchParams,
  router,
  confirmAction,
  notify,
}: UsePostDraftArgs) {
  const dateParam = isNew ? searchParams.get("date") : null;
  const recoveryKey = draftRecoveryKey(slug, dateParam);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== recoveryKey;
  const [backupAvailable, setBackupAvailable] = useState(true);
  const latestMarkdownRef = useRef("");
  const saveInFlight = useRef(false);
  const templateRequestRef = useRef<AbortController | null>(null);
  const [date, setDate] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
        matter.stringify(data.body, {
          title: data.title,
          tags: data.tags,
          date: formattedDate,
        })
      );
    } catch (err) {
      if (!controller.signal.aborted)
        notify(`✗ Template: ${err instanceof Error ? err.message : err}`);
    } finally {
      if (!controller.signal.aborted) setTemplateLoading(false);
    }
  }

  const switchTemplate = (kind: PeriodKind | "blank") => {
    const dateParam = searchParams.get("date");
    if (!dateParam || kind === template) return;
    const run = () => loadTemplate(kind, dateParam, date);
    if (hasUnsavedChanges) {
      confirmAction(
        "Replace content",
        "Switching template replaces what you've typed. Continue?",
        run
      );
    } else {
      run();
    }
  };

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
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const draftKey = recoveryKey;
    const controller = new AbortController();
    setLoadedKey(null);
    setTemplateLoading(false);
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
        "Recover unsaved writing",
        `Found a browser copy from ${new Date(backup.timestamp).toLocaleString()}. Restore it?`,
        () => setMarkdown(backup.markdown)
      );
      return true;
    };

    if (!isNew) {
      fetch(`/api/admin/get-post?slug=${encodeURIComponent(slug)}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Could not load post");
          return data;
        })
        .then((data) => {
          if (controller.signal.aborted) return;
          const rawContent = matter.stringify(data.content, {
            title: data.title,
            tags: data.tags,
            date: data.date,
          });
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
        if (suggested) loadTemplate(suggested, newDateParam, formattedDate);
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
  }, [slug, isNew, dateParam, recoveryKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Stable identity required: dep of the cmd+S keydown effect below
  const handleSave = useCallback(async () => {
    if (loading || templateLoading || saveInFlight.current) return false;
    saveInFlight.current = true;
    setSaving(true);
    notify("");

    try {
      const { data: frontmatter, content } = matter(markdown);

      const parsedTitle = (frontmatter.title || "").toString().trim();
      const parsedTags = (frontmatter.tags || "").toString().trim();
      const parsedDate = (frontmatter.date || date).toString().trim();

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
          date: parsedDate,
          content: content,
          isNew,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        notify("✓ Saved!", true);
        setHasUnsavedChanges(latestMarkdownRef.current !== markdown);
        setIsDraft(data.isDraft ?? isDraft);

        if (latestMarkdownRef.current === markdown) {
          removeDraftBackup(draftRecoveryKey(slug, searchParams.get("date")));
          removeDraftBackup(`draft-${slugToUse}`);
          if (isNew) {
            const legacy = readDraftBackup("draft-new");
            if (legacy?.date === date) removeDraftBackup("draft-new");
          }
        }
        initialContentRef.current = { markdown };

        if (latestMarkdownRef.current !== markdown) {
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
      notify(`✗ Error: ${error}`);
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
    return false;
    // notify is a page-level helper with stable behavior
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    slug,
    isNew,
    searchParams,
    date,
    markdown,
    router,
    isDraft,
    loading,
    templateLoading,
  ]);

  const handlePublish = async () => {
    if (loading || saving || publishing || isNew) return;
    // Publishing must stop when the preceding save fails.
    if (hasUnsavedChanges && !(await handleSave())) return;

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
        body: JSON.stringify({ slug: slugToUse }),
      });

      const data = await response.json();

      if (response.ok) {
        notify("✓ Published!", true);
        setIsDraft(false);
      } else {
        notify(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      notify(`✗ Error: ${error}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setPublishing(true);
    notify("");

    try {
      const response = await fetch("/api/admin/unpublish-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const data = await response.json();

      if (response.ok) {
        notify("✓ Moved to drafts", true);
        setIsDraft(true);
      } else {
        notify(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      notify(`✗ Error: ${error}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = () => {
    confirmAction(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      async () => {
        setDeleting(true);
        notify("");

        try {
          const response = await fetch(
            `/api/admin/delete-post?slug=${encodeURIComponent(slug)}`,
            { method: "DELETE" }
          );

          const data = await response.json();

          if (response.ok) {
            notify("✓ Post deleted");
            setTimeout(() => {
              router.push(
                searchParams.get("month")
                  ? `/admin?month=${searchParams.get("month")}`
                  : "/admin"
              );
            }, 1000);
          } else {
            notify(`✗ Error: ${data.error}`);
          }
        } catch (error) {
          notify(`✗ Error: ${error}`);
        } finally {
          setDeleting(false);
        }
      }
    );
  };

  // Track unsaved changes + back up the draft to localStorage
  useEffect(() => {
    latestMarkdownRef.current = markdown;
    if (loading) return;
    const hasChanged = markdown !== initialContentRef.current.markdown;
    setHasUnsavedChanges(hasChanged);

    if (hasChanged) {
      const draftKey = recoveryKey;
      const draft = {
        markdown,
        timestamp: Date.now(),
        date,
      };
      setBackupAvailable(writeDraftBackup(draftKey, draft));
    }
  }, [markdown, recoveryKey, date, loading]);

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

      if (anchor && anchor.href && !anchor.href.includes("#")) {
        e.preventDefault();
        e.stopPropagation();

        confirmAction(
          "Unsaved Changes",
          "You have unsaved changes. Are you sure you want to leave?",
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
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  return {
    date,
    loading,
    backupAvailable,
    markdown,
    setMarkdown,
    saving,
    publishing,
    deleting,
    hasUnsavedChanges,
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
