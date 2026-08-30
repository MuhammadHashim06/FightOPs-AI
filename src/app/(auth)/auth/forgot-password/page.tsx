import { AuthScreen } from "@/features/auth/components/auth-screen";
import { ForgotPasswordForm } from "@/features/auth/forms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthScreen
      title="Forgot your password?"
      description="Enter your email address and we will send you a link to reset your password."
      footerPrompt="Remembered your password?"
      footerAction={{ href: "/auth/sign-in", label: "Back to log in" }}
      form={<ForgotPasswordForm />}
    />
  );
}
