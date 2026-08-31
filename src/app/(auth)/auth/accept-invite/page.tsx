import Link from "next/link";

import { AuthScreen } from "@/features/auth/components/auth-screen";
import { FormNotice } from "@/features/auth/components/auth-fields";
import { AcceptInviteForm } from "@/features/auth/forms/accept-invite-form";
import { getFighterInviteContext } from "@/server/services/fighter-invites.service";

type AcceptInvitePageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function AcceptInvitePage({
  searchParams,
}: AcceptInvitePageProps) {
  const { token } = await searchParams;
  const invite = await getFighterInviteContext(token);

  return (
    <AuthScreen
      title="Accept your event invite."
      description={
        invite.isValid && invite.invite.hasActiveAccount
          ? "Add this event to your existing fighter workspace."
          : "Create your password to access your fighter workspace and event tasks."
      }
      footerPrompt="Already have access?"
      footerAction={{ href: "/auth/sign-in", label: "Log in" }}
      form={
        invite.isValid ? (
          <AcceptInviteForm {...invite.invite} />
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-text-muted">
                Invite unavailable
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-text-strong">
                This invite link is no longer valid
              </h2>
            </div>

            <FormNotice>
              Ask your promoter or operations team to send you a fresh invite link.
            </FormNotice>

            <Link
              href="/auth/sign-in"
              className="inline-flex h-12 items-center justify-center rounded-[var(--radius-pill)] bg-brand px-5 text-sm font-semibold text-text-inverse transition hover:bg-brand-strong"
            >
              Go to sign in
            </Link>
          </div>
        )
      }
    />
  );
}
