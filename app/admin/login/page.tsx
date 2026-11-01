"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { loginDestination } from "@/utils/loginDestination";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        router.replace(loginDestination(searchParams.get("next")));
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 border border-line bg-raised"
      >
        <h1 className="text-lg font-light mb-6 text-accent tracking-wide">
          sign in
        </h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          aria-label="Admin password"
          autoComplete="current-password"
          required
          autoFocus
          className="w-full px-3 py-2 mb-4 border border-line bg-transparent text-accent focus:outline-hidden focus:border-accent rounded-xs"
        />
        {error && (
          <p className="text-xs text-primary mb-4" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2 text-sm bg-ink text-paper dark:bg-chalk dark:text-night hover:opacity-90 disabled:opacity-30 transition-opacity rounded-xs"
        >
          {submitting ? "signing in…" : "sign in"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
