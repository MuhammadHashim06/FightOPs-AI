export type AuthRole = "promoter" | "admin" | "fighter";

export type AuthProvider = "credentials";

export type AccountStatus = "pending_verification" | "active" | "suspended";

export type UserProfile = {
  firstName: string;
  lastName: string;
  displayName: string;
};

export type AuthUser = {
  id: string;
  email: string;
  role: AuthRole;
  provider: AuthProvider;
  status: AccountStatus;
  emailVerifiedAt: string | null;
  passwordHash: string;
  profile: UserProfile;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

export type AuthSession = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
};

export type EmailVerificationToken = {
  id: string;
  userId: string;
  email: string;
  otpCode: string;
  expiresAt: string;
  createdAt: string;
  consumedAt: string | null;
};

export type PasswordResetToken = {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  consumedAt: string | null;
};

export type RegisterInput = {
  email: string;
  password: string;
  role?: AuthRole;
  firstName: string;
  lastName: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  token: string;
  password: string;
  confirmPassword: string;
};

export type VerifyEmailInput = {
  email: string;
  otpCode: string;
};

export type ResendVerificationInput = {
  email: string;
};

export type SafeAuthUser = Omit<AuthUser, "passwordHash">;
