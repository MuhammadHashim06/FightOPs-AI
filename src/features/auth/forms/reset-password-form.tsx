"use client";

import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import {
  AuthForm,
  FormNotice,
  PasswordField,
  SubmitButton,
} from "@/features/auth/components/auth-fields";
import { postAuth } from "@/features/auth/lib/auth-client";
import { useToast } from "@/providers/toast-provider";

type ResetPasswordFormProps = {
  token?: string;
  email?: string;
};

export function ResetPasswordForm({
  token = "",
  email = "",
}: ResetPasswordFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const emailNotice = useMemo(
    () =>
      email
        ? `You are resetting the password for ${email}. Set a new password below to continue.`
        : "You reached this page from your email link. Set a new password below to continue.",
    [email],
  );

  async function handleSubmit(formData: FormData) {
    if (!token) {
      showToast({
        title: "Reset link is missing or invalid.",
        variant: "error",
      });
      return;
    }

    setIsPending(true);

    try {
      const result = await postAuth("/api/v1/auth/reset-password", {
        token,
        password: String(formData.get("password") ?? ""),
        confirmPassword: String(formData.get("confirmPassword") ?? ""),
      });

      startTransition(() => {
        router.push(result.redirectTo ?? "/auth/sign-in");
      });
    } catch (submitError) {
      showToast({
        title:
          submitError instanceof Error
            ? submitError.message
            : "Unable to reset password.",
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
          Secure reset
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-text-strong">
          Reset password
        </h2>
      </div>

      <FormNotice>{emailNotice}</FormNotice>

      <PasswordField
        id="reset-password"
        name="password"
        label="New password"
        placeholder="Enter a new password"
        autoComplete="new-password"
        required
      />
      <PasswordField
        id="reset-confirm-password"
        name="confirmPassword"
        label="Confirm new password"
        placeholder="Repeat your new password"
        autoComplete="new-password"
        required
      />

      <SubmitButton disabled={isPending || !token}>
        {isPending ? "Updating password..." : "Update password"}
      </SubmitButton>
    </AuthForm>
  );
}
