"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import type React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@ai-agent-platform/ui";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-normal">Reset password</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Password reset delivery will be connected later.
      </p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(() => undefined)}>
        <label className="block text-sm font-medium">
          Email
          <input
            className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-teal-600 dark:border-zinc-800 dark:bg-zinc-950"
            type="email"
            {...form.register("email")}
          />
        </label>
        <Button className="w-full" type="submit">
          Send reset link
        </Button>
      </form>
      <p className="mt-5 text-sm text-zinc-500">
        Remembered it?{" "}
        <Link className="font-medium text-teal-700 dark:text-teal-300" href="/signin">
          Sign in
        </Link>
      </p>
    </div>
  );
}
