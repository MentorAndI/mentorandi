import Image from "next/image";
import CodexSignIn from "./components/CodexSignIn";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-10 font-sans text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="flex w-full max-w-6xl flex-col gap-12 rounded-[2rem] border border-zinc-200 bg-white p-10 shadow-xl shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/20 sm:px-14 sm:py-12">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              Codex Authentication
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Sign in to Mentorandi with Codex
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                Use the Codex sign-in flow to authenticate with your email and continue building learning experiences.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Provider</p>
                <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">Codex</p>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Route</p>
                <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">/api/auth/codex</p>
              </div>
            </div>
          </div>

          <div>
            <CodexSignIn />
          </div>
        </section>
      </main>
    </div>
  );
}
