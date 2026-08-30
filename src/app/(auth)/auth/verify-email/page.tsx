import { AuthScreen } from "@/features/auth/components/auth-screen";
import { VerifyEmailForm } from "@/features/auth/forms/verify-email-form";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    email?: string;
    redirectTo?: string;
  }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { email, redirectTo } = await searchParams;
  const signInHref = redirectTo
    ? `/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`
    : "/auth/sign-in";

  return (
    <AuthScreen
      title="Verify your email."
      description="Check your inbox and enter the verification code to continue with your account setup."
      footerPrompt="Already verified?"
      footerAction={{ href: signInHref, label: "Go to log in" }}
      form={<VerifyEmailForm email={email} redirectTo={redirectTo} />}
    />
  );
}
