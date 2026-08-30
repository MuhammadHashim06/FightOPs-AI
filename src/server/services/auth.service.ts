import { createHash, randomInt, randomUUID } from "node:crypto";

import { env } from "@/server/config/env";
import { authRepository } from "@/server/repositories/auth.repository";
import {
  hashPassword,
  verifyPassword,
} from "@/server/security/password";
import {
  createSessionToken,
  hashSessionToken,
} from "@/server/security/session";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/server/services/email.service";
import {
  validateForgotPasswordInput,
  validateLoginInput,
  validateResendVerificationInput,
  validateRegisterInput,
  validateResetPasswordInput,
  validateVerifyEmailInput,
} from "@/server/validators/auth.validator";
import type {
  AuthUser,
  ForgotPasswordInput,
  LoginInput,
  ResendVerificationInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "@/types/auth";

type LoginContext = {
  userAgent?: string | null;
  ipAddress?: string | null;
};

export async function registerUser(input: RegisterInput) {
  validateRegisterInput(input);

  const normalizedEmail = normalizeEmail(input.email);
  const role = input.role ?? "promoter";
  const existingUser = await authRepository.findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const now = new Date().toISOString();
  const user: Omit<AuthUser, "id"> = {
    email: normalizedEmail,
    role,
    provider: "credentials",
    status: "pending_verification",
    emailVerifiedAt: null,
    passwordHash: hashPassword(input.password),
    profile: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      displayName: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
    },
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
  };

  const createdUser = await authRepository.createUser(user);
  const verificationToken = await issueVerificationToken(createdUser, now);

  return {
    user: createdUser,
    verificationToken,
  };
}

export async function loginUser(input: LoginInput, context: LoginContext = {}) {
  validateLoginInput(input);

  const user = await authRepository.findUserByEmail(normalizeEmail(input.email));

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  if (!verifyPassword(input.password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }

  if (user.status === "pending_verification") {
    const now = new Date().toISOString();
    const verificationToken = await issueVerificationToken(user, now);

    return {
      status: "verification_required" as const,
      user,
      verificationToken,
    };
  }

  const now = new Date().toISOString();
  const updatedUser = await authRepository.updateUser({
    ...user,
    lastLoginAt: now,
    updatedAt: now,
  });

  const sessionToken = createSessionToken();
  const session = await authRepository.createSession({
    userId: updatedUser.id,
    refreshTokenHash: hashSessionToken(sessionToken),
    userAgent: context.userAgent ?? null,
    ipAddress: context.ipAddress ?? null,
    createdAt: now,
    expiresAt: addDays(now, env.authRefreshTokenExpiresInDays),
    revokedAt: null,
  });

  return {
    status: "authenticated" as const,
    user: updatedUser,
    session,
    sessionToken,
  };
}

export async function sendPasswordReset(input: ForgotPasswordInput) {
  validateForgotPasswordInput(input);

  const normalizedEmail = normalizeEmail(input.email);
  const user = await authRepository.findUserByEmail(normalizedEmail);

  if (!user) {
    return {
      sent: true,
      email: normalizedEmail,
    };
  }

  const rawToken = randomUUID();
  const now = new Date().toISOString();
  const passwordResetToken = await authRepository.createPasswordResetToken(
    createPasswordResetToken(user.id, user.email, rawToken, now),
  );

  await sendPasswordResetEmail({
    email: user.email,
    displayName: user.profile.displayName,
    resetToken: rawToken,
    resetUrl: createResetUrl(user.email, rawToken),
  });

  return {
    sent: true,
    email: normalizedEmail,
    resetToken: rawToken,
    resetRecord: passwordResetToken,
  };
}

export async function resendVerification(input: ResendVerificationInput) {
  validateResendVerificationInput(input);

  const normalizedEmail = normalizeEmail(input.email);
  const user = await authRepository.findUserByEmail(normalizedEmail);

  if (!user || user.status !== "pending_verification") {
    return {
      sent: true,
      email: normalizedEmail,
    };
  }

  const now = new Date().toISOString();
  const verificationToken = await issueVerificationToken(user, now);

  return {
    sent: true,
    email: normalizedEmail,
    verificationToken,
  };
}

async function issueVerificationToken(
  user: Pick<AuthUser, "id" | "email" | "profile">,
  now: string,
) {
  const verificationToken = await authRepository.createEmailVerificationToken(
    createEmailVerificationToken(user.id, user.email, now),
  );

  await sendVerificationEmail({
    email: user.email,
    displayName: user.profile.displayName,
    otpCode: verificationToken.otpCode,
  });

  return verificationToken;
}

function createEmailVerificationToken(userId: string, email: string, now: string) {
  return {
    userId,
    email,
    otpCode: generateOtpCode(),
    createdAt: now,
    expiresAt: addMinutes(now, env.authOtpExpiresInMinutes),
    consumedAt: null,
  };
}

function createPasswordResetToken(userId: string, email: string, rawToken: string, now: string) {
  return {
    userId,
    email,
    tokenHash: hashValue(rawToken),
    createdAt: now,
    expiresAt: addMinutes(now, env.authResetTokenExpiresInMinutes),
    consumedAt: null,
  };
}

function createResetUrl(email: string, rawToken: string) {
  return `${env.appUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(
    email,
  )}`;
}

export async function resetPassword(input: ResetPasswordInput) {
  validateResetPasswordInput(input);

  const token = await authRepository.findPasswordResetToken(hashValue(input.token));

  if (!token || token.consumedAt) {
    throw new Error("Reset token is invalid or expired.");
  }

  const user = await authRepository.findUserById(token.userId);

  if (!user) {
    throw new Error("User account was not found.");
  }

  const now = new Date().toISOString();
  const updatedUser = await authRepository.updateUser({
    ...user,
    passwordHash: hashPassword(input.password),
    updatedAt: now,
  });

  await authRepository.consumePasswordResetToken(token.id);

  return {
    success: true,
    user: updatedUser,
  };
}

export async function verifyEmail(input: VerifyEmailInput) {
  validateVerifyEmailInput(input);

  const normalizedEmail = normalizeEmail(input.email);
  const token = await authRepository.findEmailVerificationToken(
    normalizedEmail,
    input.otpCode.trim(),
  );

  if (!token || token.consumedAt) {
    throw new Error("Verification code is invalid or expired.");
  }

  const user = await authRepository.findUserById(token.userId);

  if (!user) {
    throw new Error("User account was not found.");
  }

  const now = new Date().toISOString();
  const updatedUser = await authRepository.updateUser({
    ...user,
    status: "active",
    emailVerifiedAt: now,
    updatedAt: now,
  });

  await authRepository.consumeEmailVerificationToken(token.id);

  return {
    success: true,
    user: updatedUser,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function generateOtpCode() {
  return String(randomInt(100000, 999999));
}

function addMinutes(isoDate: string, minutes: number) {
  return new Date(new Date(isoDate).getTime() + minutes * 60_000).toISOString();
}

function addDays(isoDate: string, days: number) {
  return new Date(new Date(isoDate).getTime() + days * 24 * 60 * 60_000).toISOString();
}
