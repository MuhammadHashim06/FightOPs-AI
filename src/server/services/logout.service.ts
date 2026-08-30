import { authRepository } from "@/server/repositories/auth.repository";
import { hashSessionToken } from "@/server/security/session";

export async function logoutUser(sessionToken: string | null | undefined) {
  if (!sessionToken) {
    return { success: true };
  }

  const session = await authRepository.findActiveSessionByTokenHash(
    hashSessionToken(sessionToken),
  );

  if (!session) {
    return { success: true };
  }

  await authRepository.revokeSession(session.id);

  return { success: true };
}
