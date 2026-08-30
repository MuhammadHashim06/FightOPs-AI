"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import {
  AuthForm,
  Field,
  PasswordField,
  SubmitButton,
} from "@/features/auth/components/auth-fields";
import { postAuth } from "@/features/auth/lib/auth-client";
import { useToast } from "@/providers/toast-provider";

type SignInFormProps = {
  verified?: string;
  reset?: string;
  redirectTo?: string;
};

export function SignInForm({
  verified,
  reset,
  redirectTo,
}: SignInFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (verified === "success") {
      showToast({
        title: "Your email has been verified. You can log in now.",
        variant: "success",
      });
      return;
    }

    if (reset === "success") {
      showToast({
        title: "Your password has been updated. Log in with your new password.",
        variant: "success",
      });
    }
  }, [reset, showToast, verified]);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);

    try {
      const result = await postAuth("/api/v1/auth/login", {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirectTo,
      });

      startTransition(() => {
        router.push(result.redirectTo ?? "/dashboard");
      });
    } catch (submitError) {
      showToast({
        title:
          submitError instanceof Error ? submitError.message : "Unable to sign in.",
        variant: "error",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthForm onSubmit={handleSubmit}>
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-text-muted">
          Welcome back
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-text-strong">
          Log in
        </h2>
      </div>

      <Field
        id="signin-email"
        name="email"
        label="Email address"
        type="email"
        placeholder="you@fightops.ai"
        autoComplete="email"
        required
      />
      <PasswordField
        id="signin-password"
        name="password"
        label="Password"
        placeholder="Enter your password"
        autoComplete="current-password"
        required
      />

      <div className="flex items-center justify-between gap-4 text-sm text-text-body">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-[var(--brand)]" />
          <span>Keep me signed in</span>
        </label>
        <Link
          href="/auth/forgot-password"
          className="font-medium text-brand transition hover:text-brand-strong"
        >
          Forgot password
        </Link>
      </div>

      <SubmitButton disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </SubmitButton>
    </AuthForm>
  );
}
