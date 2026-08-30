"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import {
  AuthForm,
  Field,
  PasswordField,
  SubmitButton,
} from "@/features/auth/components/auth-fields";
import { postAuth } from "@/features/auth/lib/auth-client";
import { useToast } from "@/providers/toast-provider";

export function SignUpForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);

    try {
      const fullName = String(formData.get("fullName") ?? "").trim();
      const [firstName, ...restNames] = fullName.split(/\s+/);
      const lastName = restNames.join(" ") || "User";

      const password = String(formData.get("password") ?? "");
      const confirmPassword = String(formData.get("confirmPassword") ?? "");

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const result = await postAuth("/api/v1/auth/register", {
        firstName,
        lastName,
        email: String(formData.get("email") ?? ""),
        password,
      });

      startTransition(() => {
        router.push(result.redirectTo ?? "/auth/verify-email");
      });
    } catch (submitError) {
      showToast({
        title:
          submitError instanceof Error
            ? submitError.message
            : "Unable to create your account.",
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
          Team onboarding
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-text-strong">
          Sign up
        </h2>
      </div>

      <Field
        id="signup-name"
        name="fullName"
        label="Full name"
        placeholder="Sarah Whitman"
        autoComplete="name"
        required
      />
      <Field
        id="signup-email"
        name="email"
        label="Email address"
        type="email"
        placeholder="sarah@fightops.ai"
        autoComplete="email"
        required
      />
      <PasswordField
        id="signup-password"
        name="password"
        label="Password"
        placeholder="Create a secure password"
        hint="Use at least 8 characters with a mix of letters and numbers."
        autoComplete="new-password"
        required
      />
      <PasswordField
        id="signup-confirm-password"
        name="confirmPassword"
        label="Confirm password"
        placeholder="Repeat your password"
        autoComplete="new-password"
        required
      />

      <label className="flex items-start gap-3 rounded-[var(--radius-pill)] border border-border-subtle bg-panel-muted p-4 text-sm text-text-body">
        <input
          type="checkbox"
          required
          className="mt-1 h-4 w-4 accent-[var(--brand)]"
        />
        <span>
          I agree to the platform terms and understand I may be asked to verify my
          email before accessing the workspace.
        </span>
      </label>

      <SubmitButton disabled={isPending}>
        {isPending ? "Creating account..." : "Create account"}
      </SubmitButton>
    </AuthForm>
  );
}
