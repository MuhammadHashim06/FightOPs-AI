import { AuthScreen } from "@/features/auth/components/auth-screen";
import { SignUpForm } from "@/features/auth/forms/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthScreen
      title="Create your account."
      description="Set up your account to get started and access your workspace."
      footerPrompt="Already have an account?"
      footerAction={{ href: "/auth/sign-in", label: "Log in" }}
      form={<SignUpForm />}
    />
  );
}
