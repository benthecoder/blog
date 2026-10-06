"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { WIKI_TEMPLATES, type WikiTemplate } from "@/config/wikiTemplates";
import type { WritingCheck } from "@/utils/content/writingChecks";

export default function WritingTools({
  isNew,
  saving,
  form,
  onTemplate,
  onJump,
}: {
  isNew: boolean;
  saving: boolean;
  form: { content: string; title: string; slug: string };
  onTemplate: (content: string) => void;
  onJump: (line: number) => void;
}) {
  const [template, setTemplate] = useState<WikiTemplate | "">("");
  const [review, setReview] = useState<{
    context: string;
    checks: WritingCheck[];
    total: number;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const context = JSON.stringify([form.content, form.title, form.slug]);
  useEffect(
    () => () => {
      requestRef.current?.abort();
    },
    []
  );
  const check = async () => {
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/writing-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not check writing");
      if (!controller.signal.aborted)
        setReview({ context, checks: data.checks, total: data.total });
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(
          failure instanceof Error ? failure.message : "Could not check writing"
        );
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  };
  return (
    <div
      id="wiki-writing-tools"
      className="mb-6 border-b border-rule dark:border-night-rule pb-4"
    >
      <div className="flex flex-wrap items-end gap-4">
        {isNew && (
          <label className="text-xs text-ink-soft dark:text-chalk-muted">
            Template
            <select
              className="mt-1 w-full rounded-xs border border-rule dark:border-night-rule bg-paper dark:bg-night px-3 py-2 text-sm text-ink-strong dark:text-chalk-strong focus:outline-none focus:ring-1 focus:ring-ink dark:focus:ring-chalk disabled:opacity-60"
              value={template}
              disabled={saving || pending}
              onChange={(event) => {
                const next = event.target.value as WikiTemplate;
                if (
                  form.content.trim() &&
                  !window.confirm(
                    "Replace the current content with this template?"
                  )
                )
                  return;
                setTemplate(next);
                onTemplate(WIKI_TEMPLATES[next].content);
                setReview(null);
                setError("");
              }}
            >
              <option value="" disabled>
                Choose…
              </option>
              {Object.entries(WIKI_TEMPLATES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => void check()}
          className="min-h-11 px-3 text-sm text-ink dark:text-chalk underline underline-offset-4 disabled:opacity-50"
        >
          {pending ? "Checking…" : "Check writing"}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 text-sm text-ink-strong dark:text-chalk-strong"
        >
          {error}
        </p>
      )}
      {review && (
        <section
          aria-label="Writing checks"
          className="mt-4 text-sm text-ink-strong dark:text-chalk-strong"
        >
          {review.context !== context ? (
            <p role="status">Changed since the check. Run it again.</p>
          ) : (
            <>
              <p role="status">
                {review.total
                  ? `${review.total} ${review.total === 1 ? "thing" : "things"} to check`
                  : "No repeated headings or missing local pages found."}
              </p>
              {review.checks.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {review.checks.map((finding, index) => (
                    <li key={`${finding.kind}-${finding.line}-${index}`}>
                      <button
                        type="button"
                        onClick={() => onJump(finding.line)}
                        className="text-left underline underline-offset-4"
                      >
                        near line {finding.line}: {finding.label}
                      </button>
                      {finding.kind === "missing-wiki" && finding.target && (
                        <Link
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`/admin/wiki/edit/new?title=${encodeURIComponent(finding.target)}`}
                          className="ml-3 text-ink dark:text-chalk underline underline-offset-4"
                        >
                          new page ↗
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {review.total > review.checks.length && (
                <p className="mt-2">
                  Showing the first {review.checks.length}.
                </p>
              )}
            </>
          )}
          <p className="mt-3 text-xs text-ink-soft dark:text-chalk-muted">
            Checks wiki/post links and headings. External links and page anchors
            aren’t checked.
          </p>
        </section>
      )}
    </div>
  );
}
