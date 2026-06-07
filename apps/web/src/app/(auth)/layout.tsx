import type React from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-svh bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex flex-col justify-between border-r border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <Link href="/dashboard" className="text-sm font-semibold">
          AI Agent Platform
        </Link>
        <div className="hidden max-w-md lg:block">
          <h1 className="text-3xl font-semibold tracking-normal">
            Voice agent operations start here.
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Authentication routes are scaffolded for the Day 1 foundation. Production flows will be
            connected later.
          </p>
        </div>
        <p className="hidden text-xs text-zinc-500 lg:block">Local development workspace</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">{children}</section>
    </main>
  );
}
