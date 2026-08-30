import { badRequest, notFound, ok, unauthorized } from "@/lib/api/response";
import {
  deleteEvent,
  getEventById,
  updateEvent,
} from "@/server/services/events.service";
import { getAuthenticatedUser } from "@/server/services/session.service";
import type { UpdateEventInput } from "@/types/event";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/v1/events/[eventId]">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const { eventId } = await context.params;
  const event = await getEventById(eventId);

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

  try {
    const body = (await request.json()) as UpdateEventInput;
    const { eventId } = await context.params;
    const event = await updateEvent(eventId, body);

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

  const { eventId } = await context.params;
  const deleted = await deleteEvent(eventId);

  if (!deleted) {
    return notFound(`Event '${eventId}' was not found.`);
  }

  return ok({ deleted: true });
}
