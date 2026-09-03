import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { changeUserPassword } from "@/server/services/auth.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  try {
    await changeUserPassword(user.id, await request.json());
    return ok({ status: "password_changed" });
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Unable to change password.",
    );
  }
}
