import { badRequest, created, forbidden, notFound, ok, unauthorized } from "@/lib/api/response";
import { getEventByIdForUser } from "@/server/services/events.service";
import { createFightForEvent } from "@/server/services/fights.service";
import { getAuthenticatedUser } from "@/server/services/session.service";
import { hasAnyRole } from "@/server/security/authorization";
import type { CreateFightInput } from "@/types/event";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/v1/events/[eventId]/fights">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasAnyRole(user, ["promoter", "admin"])) {
    return forbidden();
  }

  const { eventId } = await context.params;
  const event = await getEventByIdForUser(eventId, user);

  if (!event) {
    return notFound(`Event '${eventId}' was not found.`);
  }

  return ok({ eventId });
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/v1/events/[eventId]/fights">,
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
    const event = await getEventByIdForUser(eventId, user);

    if (!event) {
      return notFound(`Event '${eventId}' was not found.`);
    }

    const body = (await request.json()) as CreateFightInput;
    const result = await createFightForEvent(eventId, body, user);
    return created(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create fight.";

    if (message === "Event was not found.") {
      return notFound(message);
    }

    return badRequest(message);
  }
}
