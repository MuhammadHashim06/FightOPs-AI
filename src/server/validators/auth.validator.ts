import type {
  AcceptFighterInviteInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResendVerificationInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
  UpdateProfileInput,
} from "@/types/auth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterInput(input: RegisterInput) {
  assertEmail(input.email);
  assertPassword(input.password);
  assertRequired(input.firstName, "First name is required.");
  assertRequired(input.lastName, "Last name is required.");
}

export function validateLoginInput(input: LoginInput) {
  assertEmail(input.email);
  assertRequired(input.password, "Password is required.");
}

export function validateForgotPasswordInput(input: ForgotPasswordInput) {
  assertEmail(input.email);
}

export function validateResetPasswordInput(input: ResetPasswordInput) {
  assertRequired(input.token, "Reset token is required.");
  assertPassword(input.password);

  if (input.password !== input.confirmPassword) {
    throw new Error("Passwords do not match.");
  }
}

export function validateVerifyEmailInput(input: VerifyEmailInput) {
  assertEmail(input.email);
  assertRequired(input.otpCode, "Verification code is required.");

  if (input.otpCode.trim().length < 4) {
    throw new Error("Verification code is invalid.");
  }
}

export function validateResendVerificationInput(input: ResendVerificationInput) {
  assertEmail(input.email);
}

export function validateUpdateProfileInput(input: UpdateProfileInput) {
  assertRequired(input.firstName, "First name is required.");
  assertRequired(input.lastName, "Last name is required.");

  if (typeof input.phone !== "undefined" && input.phone !== null && input.phone.trim().length > 40) {
    throw new Error("Phone number must be 40 characters or fewer.");
  }
}

export function validateChangePasswordInput(input: ChangePasswordInput) {
  assertRequired(input.currentPassword, "Current password is required.");
  assertPassword(input.newPassword);

  if (input.newPassword !== input.confirmPassword) {
    throw new Error("Passwords do not match.");
  }
}

export function validateAcceptFighterInviteInput(input: AcceptFighterInviteInput) {
  assertRequired(input.token, "Invite token is required.");
  assertPassword(input.password ?? "");

  if ((input.password ?? "") !== (input.confirmPassword ?? "")) {
    throw new Error("Passwords do not match.");
  }
}

function assertEmail(email: string) {
  if (!emailPattern.test(email.trim())) {
    throw new Error("A valid email address is required.");
  }
}

function assertPassword(password: string) {
  if (password.trim().length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }
}

function assertRequired(value: string, message: string) {
  if (!value.trim()) {
    throw new Error(message);
  }
}
