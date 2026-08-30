"use client";

import { useState } from "react";

import {
  AuthForm,
  Field,
  SubmitButton,
} from "@/features/auth/components/auth-fields";
import { postAuth } from "@/features/auth/lib/auth-client";
import { useToast } from "@/providers/toast-provider";

export function ForgotPasswordForm() {
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);

    try {
      const result = await postAuth("/api/v1/auth/forgot-password", {
        email: String(formData.get("email") ?? ""),
      });

      showToast({
        title:
          result.message ?? "If the account exists, a reset email has been sent.",
        variant: "success",
      });
    } catch (submitError) {
      showToast({
        title:
          submitError instanceof Error
            ? submitError.message
            : "Unable to send reset email.",
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
          Account support
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-text-strong">
          Forgot password
        </h2>
      </div>

      <Field
        id="forgot-email"
        name="email"
        label="Email address"
        type="email"
        placeholder="you@fightops.ai"
        hint="If this account exists, a secure reset link will be sent to that email."
        autoComplete="email"
        required
      />

      <SubmitButton disabled={isPending}>
        {isPending ? "Sending link..." : "Send reset link"}
      </SubmitButton>
    </AuthForm>
  );
}
