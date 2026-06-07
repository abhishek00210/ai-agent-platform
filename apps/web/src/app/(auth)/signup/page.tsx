"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import type React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@ai-agent-platform/ui";

const signUpSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(12),
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-normal">Create workspace</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        The account flow is reserved for the next build phase.
      </p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(() => undefined)}>
        <Field label="First name" {...form.register("firstName")} />
        <Field label="Last name" {...form.register("lastName")} />
        <Field label="Email" type="email" {...form.register("email")} />
        <Field label="Password" type="password" {...form.register("password")} />
        <Button className="w-full" type="submit">
          Create account
        </Button>
      </form>
      <p className="mt-5 text-sm text-zinc-500">
        Already have an account?{" "}
        <Link className="font-medium text-teal-700 dark:text-teal-300" href="/signin">
          Sign in
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
