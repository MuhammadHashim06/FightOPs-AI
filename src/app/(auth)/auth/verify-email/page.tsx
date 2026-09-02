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

  return (
    <AuthScreen
      title="Verify your email"
      description="Enter the code sent to your inbox."
      form={<VerifyEmailForm email={email} redirectTo={redirectTo} />}
    />
  );
}
