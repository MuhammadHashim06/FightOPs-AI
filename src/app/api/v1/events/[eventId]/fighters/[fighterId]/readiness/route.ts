import { notFound, ok, unauthorized } from "@/lib/api/response";
import { getEventById } from "@/server/services/events.service";
import { getFighterReadinessDetail } from "@/server/services/readiness.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/v1/events/[eventId]/fighters/[fighterId]/readiness">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const { eventId, fighterId } = await context.params;
  const event = await getEventById(eventId);

  if (!event) {
    return notFound(`Event '${eventId}' was not found.`);
  }

  const detail = await getFighterReadinessDetail({ eventId, fighterId });

  if (!detail) {
    return notFound(`Readiness for fighter '${fighterId}' was not found.`);
  }

  return ok(detail);
}
