import { AuthScreen } from "@/features/auth/components/auth-screen";
import { SignInForm } from "@/features/auth/forms/sign-in-form";

type SignInPageProps = {
  searchParams: Promise<{
    verified?: string;
    reset?: string;
    redirectTo?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { verified, reset, redirectTo } = await searchParams;

  return (
    <AuthScreen
      title="Log in to your workspace"
      description="Enter your details to continue."
      footerPrompt="New here?"
      footerAction={{ href: "/auth/sign-up", label: "Create an account" }}
      form={
        <SignInForm
          verified={verified}
          reset={reset}
          redirectTo={redirectTo}
        />
      }
    />
  );
}
