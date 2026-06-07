"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import type React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@ai-agent-platform/ui";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-normal">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Placeholder form for structural auth.
      </p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(() => undefined)}>
        <Field label="Email" type="email" {...form.register("email")} />
        <Field label="Password" type="password" {...form.register("password")} />
        <Button className="w-full" type="submit">
          Continue
        </Button>
      </form>
      <p className="mt-5 text-sm text-zinc-500">
        No account?{" "}
        <Link className="font-medium text-teal-700 dark:text-teal-300" href="/signup">
          Create one
        </Link>
      </p>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-teal-600 dark:border-zinc-800 dark:bg-zinc-950"
        {...inputProps}
      />
    </label>
  );
}
