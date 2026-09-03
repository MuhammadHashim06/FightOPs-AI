import { forbidden, notFound, ok, unauthorized } from "@/lib/api/response";
import { getEventByIdForUser } from "@/server/services/events.service";
import { getFighterReadinessDetail } from "@/server/services/readiness.service";
import { getAuthenticatedUser } from "@/server/services/session.service";
import { hasAnyRole } from "@/server/security/authorization";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/v1/events/[eventId]/fighters/[fighterId]/readiness">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasAnyRole(user, ["promoter", "admin"])) {
    return forbidden();
  }

  const { eventId, fighterId } = await context.params;
  const event = await getEventByIdForUser(eventId, user);

  if (!event) {
    return notFound(`Event '${eventId}' was not found.`);
  }

  const detail = await getFighterReadinessDetail({ eventId, fighterId });

  if (!detail) {
    return notFound(`Readiness for fighter '${fighterId}' was not found.`);
  }

  return ok(detail);
}
