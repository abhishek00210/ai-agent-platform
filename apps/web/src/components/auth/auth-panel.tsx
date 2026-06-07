import type React from "react";
import Link from "next/link";

export function AuthPanel({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      <div className="mt-6">{children}</div>
      {footer ? <div className="mt-5 text-sm text-zinc-500">{footer}</div> : null}
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="font-medium text-teal-700 dark:text-teal-300" href={href}>
      {children}
    </Link>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{message}</p> : null;
}

export function Notice({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        tone === "error"
          ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          : "rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300"
      }
    >
      {children}
    </div>
  );
}

export function TextField(
  props: React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
  },
) {
  const { label, error, ...inputProps } = props;

  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-teal-600 dark:border-zinc-800 dark:bg-zinc-950"
        {...inputProps}
      />
      <FieldError message={error} />
    </label>
  );
}
