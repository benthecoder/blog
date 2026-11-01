"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { THOUGHT_MAX_LENGTH } from "@/config/constants";

const fieldClass =
  "w-full rounded-sm border border-line bg-transparent px-3 py-3 text-base text-primary placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type PublishState =
  | { kind: "idle" }
  | { kind: "publishing" }
  | { kind: "error"; message: string }
  | { kind: "published" }
  | { kind: "signed-out" }
  | { kind: "signing-out" };

export default function ThoughtComposer() {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [state, setState] = useState<PublishState>({ kind: "idle" });
  const pending = useRef(false);
  const busy = state.kind === "publishing" || state.kind === "signing-out";

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setState({ kind: "publishing" });
    try {
      const response = await fetch("/api/tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: note, link, title }),
      });
      if (response.status === 401) {
        setState({ kind: "signed-out" });
        return;
      }
      if (!response.ok) {
        setState({
          kind: "error",
          message:
            response.status === 429
              ? "Too many attempts. Give it a minute and try again."
              : "Couldn’t publish. Your writing is still here; try again.",
        });
        return;
      }
      setNote("");
      setLink("");
      setTitle("");
      setState({ kind: "published" });
      router.refresh();
    } catch {
      setState({
        kind: "error",
        message: "Couldn’t connect. Your writing is still here; try again.",
      });
    } finally {
      pending.current = false;
    }
  }

  async function signOut() {
    if (
      (note.trim() || link.trim()) &&
      !window.confirm("Sign out and discard this thought?")
    )
      return;
    setState({ kind: "signing-out" });
    try {
      const response = await fetch("/api/admin/login", { method: "DELETE" });
      if (!response.ok) throw new Error("Sign-out failed");
      router.replace("/admin/login?next=%2Fthoughts%2Fnew");
      router.refresh();
    } catch {
      setState({ kind: "error", message: "Couldn’t sign out. Try again." });
    }
  }

  return (
    <form onSubmit={publish} className="space-y-6">
      <div>
        <label
          htmlFor="thought-note"
          className="mb-2 block text-sm text-primary"
        >
          what’s on your mind?
        </label>
        <textarea
          id="thought-note"
          name="body"
          rows={6}
          maxLength={THOUGHT_MAX_LENGTH}
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setState({ kind: "idle" });
          }}
          placeholder="start anywhere…"
          disabled={busy}
          className={`${fieldClass} min-h-52 resize-y leading-relaxed`}
        />
        <p className="mt-2 text-right text-xs tabular-nums text-muted">
          {note.length.toLocaleString()} / {THOUGHT_MAX_LENGTH.toLocaleString()}
        </p>
      </div>
      <div>
        <label
          htmlFor="thought-link"
          className="mb-2 block text-sm text-primary"
        >
          link <span className="text-muted">(optional)</span>
        </label>
        <input
          id="thought-link"
          name="link"
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          maxLength={2048}
          value={link}
          onChange={(event) => {
            setLink(event.target.value);
            setState({ kind: "idle" });
          }}
          placeholder="https://…"
          disabled={busy}
          className={fieldClass}
        />
      </div>
      {link.trim() && (
        <div>
          <label
            htmlFor="thought-title"
            className="mb-2 block text-sm text-primary"
          >
            link title <span className="text-muted">(optional)</span>
          </label>
          <input
            id="thought-title"
            name="title"
            maxLength={300}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setState({ kind: "idle" });
            }}
            disabled={busy}
            className={fieldClass}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <p className="text-xs text-muted">publishes to your public stream.</p>
        <button
          type="submit"
          disabled={
            busy ||
            (!note.trim() && !link.trim()) ||
            state.kind === "signed-out"
          }
          className="min-h-11 rounded-sm bg-ink px-5 py-2 text-sm text-paper dark:bg-chalk dark:text-night disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {state.kind === "publishing" ? "publishing…" : "publish thought"}
        </button>
      </div>
      {state.kind === "error" && (
        <p role="alert" className="text-sm text-primary">
          {state.message}
        </p>
      )}
      {state.kind === "signed-out" && (
        <p role="alert" className="text-sm text-primary">
          Your session expired.{" "}
          <Link
            href="/admin/login?next=%2Fthoughts%2Fnew"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Sign in in a new tab
          </Link>
          , then{" "}
          <button
            type="button"
            className="underline"
            onClick={() => setState({ kind: "idle" })}
          >
            try publishing again
          </button>
          . Your writing stays here.
        </p>
      )}
      {state.kind === "published" && (
        <p role="status" className="text-sm text-primary">
          published.{" "}
          <Link href="/thoughts" className="underline underline-offset-4">
            view your stream →
          </Link>
        </p>
      )}
      <button
        type="button"
        onClick={() => void signOut()}
        disabled={busy}
        className="min-h-11 text-xs text-muted underline underline-offset-4 hover:text-accent disabled:opacity-40"
      >
        {state.kind === "signing-out" ? "signing out…" : "sign out"}
      </button>
    </form>
  );
}
