"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { slug as slugify } from "github-slugger";
import type { WikiTemplate } from "@/types/wiki";
import type { WritingCheck } from "@/utils/content/writingChecks";

const linkButton =
  "focus-ring text-left text-accent underline underline-offset-4 disabled:opacity-50";

/**
 * Local writing checks for the wiki editor. Each broken [[link]] offers the
 * closest existing pages (one click retargets every occurrence, keeping the
 * visible label) or a stub page made from the Concept template.
 */
export default function WritingTools({
  saving,
  form,
  stubTemplate,
  onRetarget,
  onJump,
}: {
  saving: boolean;
  form: { content: string; title: string; slug: string };
  stubTemplate: WikiTemplate | undefined;
  onRetarget: (target: string, replacement: string) => void;
  onJump: (line: number) => void;
}) {
  const [review, setReview] = useState<{
    context: string;
    checks: WritingCheck[];
    total: number;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
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

  const createStub = async (target: string) => {
    setPending(true);
    setError("");
    setNote("");
    try {
      const response = await fetch("/api/admin/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slugify(target),
          title: target,
          category: stubTemplate?.category ?? "",
          description: "",
          tags: stubTemplate?.tags ?? "",
          content: stubTemplate?.content ?? "",
          create: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create page");
      setNote(
        `Created /wiki/${data.page.slug}. Fill it in before you publish.`
      );
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not create page"
      );
    } finally {
      setPending(false);
    }
    await check();
  };

  return (
    <div id="wiki-writing-tools" className="mb-6 border-b border-line pb-4">
      <button
        type="button"
        disabled={pending || saving}
        onClick={() => void check()}
        className="focus-ring min-h-11 px-3 text-sm text-accent underline underline-offset-4 disabled:opacity-50"
      >
        {pending ? "Checking…" : "Check writing"}
      </button>
      {error && (
        <p role="alert" className="mt-4 text-sm text-primary">
          {error}
        </p>
      )}
      {note && (
        <p role="status" className="mt-4 text-sm text-primary">
          {note}
        </p>
      )}
      {review && (
        <section
          aria-label="Writing checks"
          className="mt-4 text-sm text-primary"
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
                <ul className="mt-3 space-y-3">
                  {review.checks.map((finding, index) => (
                    <li key={`${finding.kind}-${finding.line}-${index}`}>
                      <button
                        type="button"
                        onClick={() => onJump(finding.line)}
                        className="focus-ring text-left underline underline-offset-4"
                      >
                        near line {finding.line}: {finding.label}
                      </button>
                      {finding.kind === "missing-wiki" && finding.target && (
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 pl-4 text-xs">
                          {finding.suggestions?.map((suggestion) => (
                            <button
                              key={suggestion.href}
                              type="button"
                              disabled={saving}
                              className={linkButton}
                              onClick={() =>
                                onRetarget(finding.target!, suggestion.title)
                              }
                            >
                              use “{suggestion.title}”
                            </button>
                          ))}
                          <button
                            type="button"
                            disabled={pending || saving}
                            className={linkButton}
                            onClick={() => void createStub(finding.target!)}
                          >
                            create stub
                          </button>
                          <Link
                            target="_blank"
                            rel="noopener noreferrer"
                            href={`/admin/wiki/edit/new?title=${encodeURIComponent(finding.target)}`}
                            className={linkButton}
                          >
                            new page ↗
                          </Link>
                        </div>
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
