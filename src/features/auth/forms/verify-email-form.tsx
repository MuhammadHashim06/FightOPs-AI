"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import {
  AuthForm,
  FormNotice,
  OtpField,
  SubmitButton,
} from "@/features/auth/components/auth-fields";
import { postAuth } from "@/features/auth/lib/auth-client";
import { useToast } from "@/providers/toast-provider";

type VerifyEmailFormProps = {
  email?: string;
  redirectTo?: string;
};

export function VerifyEmailForm({
  email = "",
  redirectTo = "",
}: VerifyEmailFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const notice = useMemo(
    () =>
      email
        ? `We sent a verification code to ${email}. Enter it here to continue with your account setup.`
        : "Enter the verification code you received to continue with your account setup.",
    [email],
  );

  async function handleSubmit(formData: FormData) {
    if (!email) {
      showToast({
        title: "Verification email is missing. Please try signing in again.",
        variant: "error",
      });
      return;
    }

    setIsPending(true);

    try {
      const result = await postAuth("/api/v1/auth/verify-email", {
        email,
        otpCode: String(formData.get("otpCode") ?? ""),
        redirectTo,
      });

      startTransition(() => {
        router.push(result.redirectTo ?? "/auth/sign-in");
      });
    } catch (submitError) {
      showToast({
        title:
          submitError instanceof Error
            ? submitError.message
            : "Unable to verify email.",
        variant: "error",
      });
    } finally {
      setIsPending(false);
    }
  }

  async function handleResendCode() {
    if (!email) {
      showToast({
        title: "Verification email is missing. Please sign up or sign in again.",
        variant: "error",
      });
      return;
    }

    setIsResending(true);

    try {
      const result = await postAuth("/api/v1/auth/resend-verification", {
        email,
      });

      showToast({
        title: result.message ?? "A new verification code has been sent.",
        variant: "success",
      });
    } catch (submitError) {
      showToast({
        title:
          submitError instanceof Error
            ? submitError.message
            : "Unable to resend verification code.",
        variant: "error",
      });
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthForm onSubmit={handleSubmit}>
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-text-muted">
          Inbox confirmation
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-text-strong">
          Verify your email
        </h2>
      </div>

      <FormNotice>{notice}</FormNotice>

      <OtpField
        id="verify-email-code"
        name="otpCode"
        label="Verification code"
        placeholder="Enter verification code"
        required
      />

      <SubmitButton disabled={isPending}>
        {isPending ? "Verifying..." : "Verify email"}
      </SubmitButton>

      <div className="flex flex-wrap gap-4 text-sm">
        <button
          type="button"
          onClick={handleResendCode}
          disabled={isResending}
          className="font-medium text-brand transition hover:text-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResending ? "Resending..." : "Resend code"}
        </button>
        <Link
          href={
            redirectTo
              ? `/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`
              : "/auth/sign-in"
          }
          className="font-medium text-brand transition hover:text-brand-strong"
        >
          Back to log in
        </Link>
      </div>
    </AuthForm>
  );
}
