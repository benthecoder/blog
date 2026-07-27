"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
        router.push(searchParams.get("next") || "/admin");
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
    <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 border border-rule dark:border-gray-700 bg-white dark:bg-gray-800"
      >
        <h1 className="text-lg font-light mb-6 text-ink dark:text-chalk tracking-wide">
          Admin Login
        </h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full px-3 py-2 mb-4 border border-rule dark:border-gray-700 bg-transparent text-ink dark:text-chalk focus:outline-hidden focus:border-ink dark:focus:border-chalk rounded-xs"
        />
        {error && (
          <p className="text-xs text-red-500 mb-4" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2 text-sm bg-ink dark:bg-chalk text-white dark:text-ink hover:opacity-90 disabled:opacity-30 transition-opacity rounded-xs"
        >
          {submitting ? "Logging in..." : "Log in"}
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
