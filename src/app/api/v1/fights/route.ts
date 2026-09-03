import { forbidden, ok, unauthorized } from "@/lib/api/response";
import { hasAnyRole } from "@/server/security/authorization";
import { getAuthenticatedUser } from "@/server/services/session.service";
import { listFightsForUser } from "@/server/services/fights.service";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasAnyRole(user, ["promoter", "admin"])) {
    return forbidden();
  }

  return ok({
    fights: await listFightsForUser(user),
  });
}
