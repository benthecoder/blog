"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { slug as slugify } from "github-slugger";
import CodeMirror from "@uiw/react-codemirror";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import MarkdownPreview from "@/components/posts/MarkdownPreview";
import {
  markdownEditorExtensions,
  markdownEditorSetup,
} from "@/components/admin/markdownEditorConfig";
import type { PaperFields, WikiEditorPage, WikiTemplate } from "@/types/wiki";
import type { LinkableEntry } from "@/types/links";
import {
  EMPTY_PAPER_FIELDS,
  isPaperCategory,
} from "@/utils/content/paperFields";
import { retargetWikiLinks } from "@/utils/content/writingChecks";
import WritingTools from "./WritingTools";

function pageForm(page: WikiEditorPage | null, initialTitle = "") {
  return {
    slug: page?.slug ?? slugify(initialTitle).slice(0, 120),
    title: page?.title ?? initialTitle,
    category: page?.category ?? "",
    description: page?.description ?? "",
    tags: page?.tags.join(", ") ?? "",
    content: page?.content ?? "",
    paper: page?.paper ?? EMPTY_PAPER_FIELDS,
  };
}

const PAPER_INPUTS: { key: keyof PaperFields; label: string; hint?: string }[] =
  [
    { key: "authors", label: "Authors" },
    { key: "year", label: "Year" },
    { key: "url", label: "Link", hint: "arXiv, DOI or PDF" },
    { key: "read", label: "Read on", hint: "YYYY-MM-DD" },
    { key: "source", label: "Notes from", hint: "e.g. remarkable" },
  ];

const fieldClass =
  "w-full rounded-xs border border-rule dark:border-night-rule bg-paper dark:bg-night px-3 py-2 text-sm text-ink-strong dark:text-chalk-strong focus:outline-none focus:ring-1 focus:ring-ink dark:focus:ring-chalk disabled:opacity-60";

const wikiEditorExtensions = [
  ...markdownEditorExtensions,
  EditorView.contentAttributes.of({ "aria-labelledby": "wiki-content-label" }),
];

export default function WikiEditor({
  initialPage,
  linkEntries,
  templates,
  initialTitle = "",
}: {
  initialPage: WikiEditorPage | null;
  linkEntries: LinkableEntry[];
  templates: WikiTemplate[];
  initialTitle?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => pageForm(initialPage, initialTitle));
  const [saved, setSaved] = useState(() =>
    JSON.stringify(pageForm(initialPage, initialTitle))
  );
  const [templateKey, setTemplateKey] = useState("blank");
  const [tools, setTools] = useState(false);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const [version, setVersion] = useState(initialPage?.version ?? "");
  const [isNew, setIsNew] = useState(initialPage === null);
  const [slugTouched, setSlugTouched] = useState(initialPage !== null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const dirty = JSON.stringify(form) !== saved;
  const showPaper =
    isPaperCategory(form.category) ||
    templates.find((t) => t.key === templateKey)?.paper ||
    Object.values(form.paper).some(Boolean);

  const applyTemplate = (key: string) => {
    const template = templates.find((t) => t.key === key);
    if (!template) return;
    if (
      form.content.trim() &&
      !window.confirm("Replace the current content with this template?")
    )
      return;
    setTemplateKey(key);
    setForm((current) => ({
      ...current,
      content: template.content,
      category: current.category || template.category,
      tags: current.tags || template.tags,
    }));
  };

  const jumpToLine = (line: number) => {
    setPreview(false);
    const reveal = () => {
      const view = editorRef.current?.view;
      if (!view) return;
      view.dispatch({
        selection: {
          anchor: view.state.doc.line(Math.min(line, view.state.doc.lines))
            .from,
        },
        scrollIntoView: true,
      });
      view.focus();
    };
    if (preview) requestAnimationFrame(reveal);
    else reveal();
  };

  const save = useCallback(async () => {
    if (saving || !form.title.trim() || !form.slug) return;
    setSaving(true);
    setMessage("");
    setFailed(false);
    try {
      const response = await fetch("/api/admin/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, create: isNew, version }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not save wiki page");
      const page = data.page as WikiEditorPage;
      const normalized = pageForm(page);
      setForm(normalized);
      setSaved(JSON.stringify(normalized));
      setVersion(page.version);
      setIsNew(false);
      setMessage("Saved locally");
      if (isNew)
        router.replace(`/admin/wiki/edit/${encodeURIComponent(page.slug)}`);
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(
        error instanceof Error ? error.message : "Could not save wiki page"
      );
    } finally {
      setSaving(false);
    }
  }, [form, isNew, version, saving, router]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  return (
    <div className="flex min-h-screen flex-col bg-paper dark:bg-night">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 md:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-rule dark:border-night-rule pb-4">
          <Link
            href="/admin/wiki"
            className="text-sm text-ink-soft dark:text-chalk-muted hover:underline"
            onClick={(event) => {
              if (
                dirty &&
                !window.confirm("Leave without saving your changes?")
              )
                event.preventDefault();
            }}
          >
            ← wiki pages
          </Link>
          <div className="flex items-center gap-4">
            {dirty && (
              <span className="text-xs text-ink-soft dark:text-chalk-muted">
                Unsaved changes
              </span>
            )}
            <button
              type="button"
              aria-expanded={tools}
              aria-controls="wiki-writing-tools"
              onClick={() => setTools(!tools)}
              className="text-sm text-ink-soft dark:text-chalk-muted hover:underline"
            >
              Check
            </button>
            <button
              type="button"
              aria-pressed={preview}
              onClick={() => setPreview(!preview)}
              className="text-sm text-ink-soft dark:text-chalk-muted hover:underline"
            >
              {preview ? "Edit" : "Preview"}
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={
                saving || !form.title.trim() || !form.slug || (!dirty && !isNew)
              }
              className="rounded-xs bg-ink dark:bg-chalk text-paper dark:text-night px-4 py-2 text-sm disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </header>
        {tools && (
          <WritingTools
            saving={saving}
            form={form}
            stubTemplate={templates.find((t) => t.key === "concept")}
            onRetarget={(target, replacement) =>
              setForm((current) => ({
                ...current,
                content: retargetWikiLinks(
                  current.content,
                  target,
                  replacement
                ),
              }))
            }
            onJump={jumpToLine}
          />
        )}

        <h1 className="mb-4 text-xl text-ink-strong dark:text-chalk-strong">
          {isNew ? "New wiki page" : "Edit wiki page"}
        </h1>
        <p className="mb-4 text-xs text-ink-soft dark:text-chalk-muted">
          Save locally with ⌘S or Ctrl+S. Commit and push when you’re ready to
          update the live site.
        </p>
        {message && (
          <p
            role={failed ? "alert" : "status"}
            className="mb-4 rounded-xs border border-rule dark:border-night-rule p-3 text-sm text-ink-strong dark:text-chalk-strong"
          >
            {message}
          </p>
        )}

        {preview ? (
          <div className="py-6">
            <p className="mb-2 text-xs text-ink-soft dark:text-chalk-muted">
              {form.category || "uncategorized"}
            </p>
            <h2 className="text-2xl font-bold lowercase text-ink-strong dark:text-chalk-strong">
              {form.title || "Untitled"}
            </h2>
            {form.description && (
              <p className="mt-2 text-sm text-ink-soft dark:text-chalk-muted">
                {form.description}
              </p>
            )}
            <article className="prose prose-sm dark:prose-invert mt-8 max-w-none">
              <MarkdownPreview
                content={form.content}
                linkEntries={linkEntries}
              />
            </article>
          </div>
        ) : (
          <>
            {isNew && templates.length > 1 && (
              <label className="mb-4 block text-xs text-ink-soft dark:text-chalk-muted">
                Start from
                <select
                  value={templateKey}
                  disabled={saving}
                  onChange={(event) => applyTemplate(event.target.value)}
                  className={`${fieldClass} mt-1 sm:w-64`}
                >
                  {templates.map((template) => (
                    <option key={template.key} value={template.key}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <fieldset
              disabled={saving}
              className="mb-6 grid gap-4 sm:grid-cols-2"
            >
              <label className="text-xs text-ink-soft dark:text-chalk-muted">
                Title
                <input
                  value={form.title}
                  maxLength={200}
                  onChange={(event) => {
                    const title = event.target.value;
                    setForm((current) => ({
                      ...current,
                      title,
                      ...(slugTouched ? {} : { slug: slugify(title) }),
                    }));
                  }}
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className="text-xs text-ink-soft dark:text-chalk-muted">
                Page address
                <input
                  value={form.slug}
                  readOnly={!isNew}
                  maxLength={120}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setForm((current) => ({
                      ...current,
                      slug: event.target.value,
                    }));
                  }}
                  className={`${fieldClass} mt-1`}
                />
                <span className="mt-1 block">
                  /wiki/{form.slug || "your-topic"}
                </span>
              </label>
              <label className="text-xs text-ink-soft dark:text-chalk-muted">
                Category
                <input
                  value={form.category}
                  maxLength={200}
                  placeholder="religion/christianity"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className="text-xs text-ink-soft dark:text-chalk-muted">
                Tags, separated by commas
                <input
                  value={form.tags}
                  maxLength={1000}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tags: event.target.value,
                    }))
                  }
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className="sm:col-span-2 text-xs text-ink-soft dark:text-chalk-muted">
                Description
                <input
                  value={form.description}
                  maxLength={1000}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className={`${fieldClass} mt-1`}
                />
              </label>
            </fieldset>
            {showPaper && (
              <fieldset
                disabled={saving}
                className="mb-6 grid gap-4 border-t border-rule dark:border-night-rule pt-4 sm:grid-cols-2"
              >
                <legend className="text-xs text-ink-soft dark:text-chalk-muted">
                  Paper · shown on /papers
                </legend>
                {PAPER_INPUTS.map(({ key, label, hint }) => (
                  <label
                    key={key}
                    className="text-xs text-ink-soft dark:text-chalk-muted"
                  >
                    {label}
                    <input
                      value={form.paper[key]}
                      maxLength={key === "url" ? 1000 : 500}
                      placeholder={hint}
                      onChange={(event) => {
                        const value = event.target.value;
                        setForm((current) => ({
                          ...current,
                          paper: { ...current.paper, [key]: value },
                        }));
                      }}
                      className={`${fieldClass} mt-1`}
                    />
                  </label>
                ))}
              </fieldset>
            )}
            <p
              id="wiki-content-label"
              className="mb-2 text-xs text-ink-soft dark:text-chalk-muted"
            >
              Content · connect pages with [[Title]] or [[Title|label]]
            </p>
            <div className="min-h-[45vh] flex-1 border border-rule dark:border-night-rule rounded-xs">
              <CodeMirror
                ref={editorRef}
                id="wiki-content"
                value={form.content}
                readOnly={saving}
                onChange={(content) =>
                  setForm((current) => ({ ...current, content }))
                }
                extensions={wikiEditorExtensions}
                basicSetup={markdownEditorSetup}
                theme="none"
                placeholder="Write your notes here…"
                className="h-full font-mono text-base text-ink-strong dark:text-chalk-strong"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
