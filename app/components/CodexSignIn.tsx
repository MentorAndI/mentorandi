"use client";

import { useState } from "react";

export default function CodexSignIn() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/auth/codex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus("idle");
        setMessage(result.error ?? "Unable to sign in.");
        return;
      }

      setStatus("success");
      setMessage(`Signed in as ${result.email}.`);
    } catch {
      setStatus("idle");
      setMessage("Unable to sign in. Please try again.");
    }
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white/90 p-8 shadow-xl shadow-zinc-200/40 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-black/20">
      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
          Codex Sign In
        </p>
        <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Access Mentorandi with Codex
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Enter your email and continue with the Codex provider.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Email address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-800"
            placeholder="you@example.com"
            required
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-black dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Signing in..." : "Sign in with Codex"}
        </button>
      </form>

      {message ? (
        <p
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            status === "success"
              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
