import { cookies } from "next/headers";

import { authRepository } from "@/server/repositories/auth.repository";
import {
  SESSION_COOKIE_NAME,
  hashSessionToken,
} from "@/server/security/session";
import type { AuthUser } from "@/types/auth";

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return getAuthenticatedUserFromToken(sessionToken);
}

export async function getAuthenticatedUserFromToken(
  sessionToken: string | null | undefined,
): Promise<AuthUser | null> {
  if (!sessionToken) {
    return null;
  }

  const session = await authRepository.findActiveSessionByTokenHash(
    hashSessionToken(sessionToken),
  );

  if (!session) {
    return null;
  }

  const user = await authRepository.findUserById(session.userId);

  if (!user || user.status !== "active") {
    await authRepository.revokeSession(session.id);
    return null;
  }

  return user;
}
