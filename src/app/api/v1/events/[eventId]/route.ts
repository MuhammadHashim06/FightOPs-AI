import { badRequest, forbidden, notFound, ok, unauthorized } from "@/lib/api/response";
import {
  deleteEventForUser,
  getEventByIdForUser,
  updateEventForUser,
} from "@/server/services/events.service";
import { getAuthenticatedUser } from "@/server/services/session.service";
import { hasAnyRole } from "@/server/security/authorization";
import type { UpdateEventInput } from "@/types/event";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/v1/events/[eventId]">,
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

  return ok({ event });
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/v1/events/[eventId]">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasAnyRole(user, ["promoter", "admin"])) {
    return forbidden();
  }

  try {
    const body = (await request.json()) as UpdateEventInput;
    const { eventId } = await context.params;
    const event = await updateEventForUser(eventId, body, user);

    if (!event) {
      return notFound(`Event '${eventId}' was not found.`);
    }

    return ok({ event });
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Unable to update event.",
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/v1/events/[eventId]">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasAnyRole(user, ["promoter", "admin"])) {
    return forbidden();
  }

  const { eventId } = await context.params;
  const deleted = await deleteEventForUser(eventId, user);

  if (!deleted) {
    return notFound(`Event '${eventId}' was not found.`);
  }

  return ok({ deleted: true });
}
