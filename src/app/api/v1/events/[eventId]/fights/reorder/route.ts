import { badRequest, forbidden, notFound, ok, unauthorized } from "@/lib/api/response";
import { hasAnyRole } from "@/server/security/authorization";
import { reorderFightsForEvent } from "@/server/services/fights.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/v1/events/[eventId]/fights/reorder">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasAnyRole(user, ["promoter", "admin"])) {
    return forbidden();
  }

  try {
    const { eventId } = await context.params;
    const body = (await request.json()) as { fightIds?: unknown };

    if (!Array.isArray(body.fightIds) || !body.fightIds.every((fightId) => typeof fightId === "string")) {
      return badRequest("fightIds must be an array of fight IDs.");
    }

    const fights = await reorderFightsForEvent(eventId, body.fightIds, user);
    return ok({ fights });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save fight order.";

    if (message === "Event was not found.") {
      return notFound(message);
    }

    return badRequest(message);
  }
}
