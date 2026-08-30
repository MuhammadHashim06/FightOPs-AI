import type { AuthUser, SafeAuthUser } from "@/types/auth";

export function toSafeAuthUser(user: AuthUser): SafeAuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    provider: user.provider,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}
