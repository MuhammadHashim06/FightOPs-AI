import { badRequest, created, notFound, ok, unauthorized } from "@/lib/api/response";
import {
  createEventRequirement,
  listEventRequirements,
} from "@/server/services/event-requirements.service";
import { getEventById } from "@/server/services/events.service";
import { getAuthenticatedUser } from "@/server/services/session.service";
import type { CreateEventRequirementInput } from "@/types/readiness";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/v1/events/[eventId]/requirements">,
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

  try {
    const { eventId } = await context.params;
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
