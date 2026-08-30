import { AuthScreen } from "@/features/auth/components/auth-screen";
import { ResetPasswordForm } from "@/features/auth/forms/reset-password-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
    email?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token, email } = await searchParams;

  return (
    <AuthScreen
      title="Reset your password."
      description="Choose a new password to finish resetting your account."
      footerPrompt="Need a new link?"
      footerAction={{ href: "/auth/forgot-password", label: "Request reset email" }}
      form={<ResetPasswordForm token={token} email={email} />}
    />
  );
}
