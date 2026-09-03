import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { toSafeAuthUser } from "@/server/services/auth-presenter";
import { updateUserProfile } from "@/server/services/auth.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const updatedUser = await updateUserProfile(user.id, body);

    return ok({ user: toSafeAuthUser(updatedUser) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update profile.";
    return badRequest(message);
  }
}
