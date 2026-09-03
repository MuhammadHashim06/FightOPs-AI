import { badRequest, created, forbidden, notFound, ok, unauthorized } from "@/lib/api/response";
import {
  createEventRequirement,
  deleteEventRequirement,
  listEventRequirements,
  updateEventRequirement,
} from "@/server/services/event-requirements.service";
import { getEventByIdForUser } from "@/server/services/events.service";
import { getAuthenticatedUser } from "@/server/services/session.service";
import { hasAnyRole } from "@/server/security/authorization";
import type { CreateEventRequirementInput } from "@/types/readiness";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/v1/events/[eventId]/requirements">,
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

  const requirements = await listEventRequirements(eventId);
  return ok({ requirements });
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/v1/events/[eventId]/requirements">,
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

    const body = (await request.json()) as CreateEventRequirementInput;
    const requirement = await createEventRequirement(eventId, body);
    return created({ requirement });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create requirement.";

    if (message === "Event was not found.") {
      return notFound(message);
    }

    return badRequest(message);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/v1/events/[eventId]/requirements">,
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  if (!hasAnyRole(user, ["promoter", "admin"])) return forbidden();

  try {
    const { eventId } = await context.params;
    if (!(await getEventByIdForUser(eventId, user))) return notFound(`Event '${eventId}' was not found.`);
    const body = (await request.json()) as { requirementId?: string } & CreateEventRequirementInput;
    if (!body.requirementId) return badRequest("Requirement id is required.");
    const { requirementId, ...input } = body;
    const requirement = await updateEventRequirement(eventId, requirementId, input);
    return ok({ requirement });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Unable to update requirement.");
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/v1/events/[eventId]/requirements">,
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();
  if (!hasAnyRole(user, ["promoter", "admin"])) return forbidden();

  try {
    const { eventId } = await context.params;
    if (!(await getEventByIdForUser(eventId, user))) return notFound(`Event '${eventId}' was not found.`);
    const { requirementId } = (await request.json()) as { requirementId?: string };
    if (!requirementId) return badRequest("Requirement id is required.");
    await deleteEventRequirement(eventId, requirementId);
    return ok({ deleted: true });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Unable to delete requirement.");
  }
}
