import { badRequest, forbidden, ok, unauthorized } from "@/lib/api/response";
import { getEventByIdForUser } from "@/server/services/events.service";
import {
  listEventReminders,
  sendDueReminders,
} from "@/server/services/reminders.service";
import { getAuthenticatedUser } from "@/server/services/session.service";
import { hasAnyRole } from "@/server/security/authorization";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/v1/events/[eventId]/reminders">,
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
    return badRequest("Event was not found.");
  }

  const result = await listEventReminders(eventId);
  return ok(result);
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/v1/events/[eventId]/reminders">,
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
    return badRequest("Event was not found.");
  }

  try {
    const body = (await request.json()) as { action?: string };

    if (body.action !== "send-due") {
      return badRequest("A valid reminder action is required.");
    }

    const result = await sendDueReminders(eventId);
    return ok(result);
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Unable to process reminders.",
    );
  }
}
