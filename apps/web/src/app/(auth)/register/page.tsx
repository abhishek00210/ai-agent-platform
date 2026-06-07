"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@ai-agent-platform/ui";
import { AuthLink, AuthPanel, Notice, TextField } from "@/components/auth/auth-panel";
import { authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/store/auth-store";

const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    email: z.string().email("Enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters.").max(100),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterForm) {
    setError(null);

    try {
      const session = await authApi.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });
      setSession(session);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create account.");
    }
  }

  return (
    <AuthPanel
      title="Create workspace"
      description="Register the first user and default organization."
      footer={
        <>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="First name"
            autoComplete="given-name"
            error={form.formState.errors.firstName?.message}
            {...form.register("firstName")}
          />
          <TextField
            label="Last name"
            autoComplete="family-name"
            error={form.formState.errors.lastName?.message}
            {...form.register("lastName")}
          />
        </div>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={form.formState.errors.confirmPassword?.message}
          {...form.register("confirmPassword")}
        />
        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthPanel>
  );
}
