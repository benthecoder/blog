"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { useRouter, useSearchParams } from "next/navigation";
import matter from "gray-matter";
import { DEFAULT_POST_TEMPLATE } from "../post-template";

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
  const [date, setDate] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [prevSlug, setPrevSlug] = useState<string | null>(null);
  const [nextSlug, setNextSlug] = useState<string | null>(null);
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

  // Prev/next dates for new posts: pure function of the date param
  const dateParam = isNew ? searchParams.get("date") : null;
  const shiftDate = (base: string, days: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const prevDate = dateParam ? shiftDate(dateParam, -1) : null;
  const nextDate = dateParam ? shiftDate(dateParam, 1) : null;

  // Post/template load syncs fetch + localStorage draft state into the
  // editor; inherently effect-driven.
  /* eslint-disable react-hooks/set-state-in-effect */
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
      const newDateParam = searchParams.get("date");
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

        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          // Only show the draft if it's from the same date
          if (draft.date === formattedDate) {
            confirmAction(
              "Draft Found",
              `Found unsaved draft from ${new Date(draft.timestamp).toLocaleString()}. Restore it?`,
              () => setMarkdown(draft.markdown)
            );
          } else {
            // Remove outdated draft from different date
            localStorage.removeItem(draftKey);
          }
        }
      }
    }
    // confirmAction/notify are page-level helpers, not load triggers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isNew, searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Stable identity required: dep of the cmd+S keydown effect below
  const handleSave = useCallback(async () => {
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
        setHasUnsavedChanges(false);
        setIsDraft(data.isDraft ?? isDraft);

        const draftKey = `draft-${slugToUse}`;
        localStorage.removeItem(draftKey);
        initialContentRef.current = { markdown };

        if (isNew) {
          router.push(`/admin/edit/${data.slug}`);
        }
      } else {
        notify(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      notify(`✗ Error: ${error}`);
    } finally {
      setSaving(false);
    }
    // notify is a page-level helper with stable behavior
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isNew, searchParams, date, markdown, router, isDraft]);

  const handlePublish = async () => {
    // Save first if there are unsaved changes
    if (hasUnsavedChanges) {
      await handleSave();
    }

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
    markdown,
    setMarkdown,
    saving,
    publishing,
    deleting,
    hasUnsavedChanges,
    isDraft,
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
