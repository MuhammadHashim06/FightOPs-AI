"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import {
  AuthForm,
  FormNotice,
  PasswordField,
  SubmitButton,
} from "@/features/auth/components/auth-fields";
import { postAuth } from "@/features/auth/lib/auth-client";
import { useToast } from "@/providers/toast-provider";

type AcceptInviteFormProps = {
  token: string;
  fighterName: string;
  contactEmail: string;
  eventName: string;
  eventDate: string;
  promoterName: string;
  division: string;
  hasActiveAccount: boolean;
};

export function AcceptInviteForm({
  token,
  fighterName,
  contactEmail,
  eventName,
  eventDate,
  promoterName,
  division,
  hasActiveAccount,
}: AcceptInviteFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);

    try {
      const result = await postAuth("/api/v1/auth/accept-invite", {
        token,
        password: String(formData.get("password") ?? "").trim(),
        confirmPassword: String(formData.get("confirmPassword") ?? "").trim(),
      });

      showToast({
        title: "Invite accepted successfully.",
        variant: "success",
      });

      startTransition(() => {
        router.push(result.redirectTo ?? "/dashboard/fighter");
        router.refresh();
      });
    } catch (error) {
      showToast({
        title:
          error instanceof Error ? error.message : "Unable to accept invite.",
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
          Fighter invite
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-text-strong">
          Accept your invite
        </h2>
      </div>

      <FormNotice>
        <strong>{fighterName}</strong> was invited to <strong>{eventName}</strong> by{" "}
        <strong>{promoterName}</strong>. Event date: {eventDate}. Division: {division}.
      </FormNotice>

      <FormNotice>
        {hasActiveAccount ? (
          <>
            Your <strong>{contactEmail}</strong> account is already active. Accept
            this invite to add the event to your workspace.
          </>
        ) : (
          <>
            Your account will be created for <strong>{contactEmail}</strong>. Set
            your password below to continue.
          </>
        )}
      </FormNotice>

      {hasActiveAccount ? null : (
        <>
          <PasswordField
            id="accept-invite-password"
            name="password"
            label="Password"
            placeholder="Create your password"
            autoComplete="new-password"
            required
          />
          <PasswordField
            id="accept-invite-confirm-password"
            name="confirmPassword"
            label="Confirm password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            required
          />
        </>
      )}

      <SubmitButton disabled={isPending}>
        {isPending
          ? hasActiveAccount
            ? "Adding invite..."
            : "Setting up your account..."
          : "Accept invite"}
      </SubmitButton>
    </AuthForm>
  );
}
