import { badRequest, created, ok, unauthorized } from "@/lib/api/response";
import { createEvent, listEvents } from "@/server/services/events.service";
import { getAuthenticatedUser } from "@/server/services/session.service";
import type { CreateEventInput } from "@/types/event";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const events = await listEvents();
  return ok({ events });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as CreateEventInput;
    const event = await createEvent(body, user.id);
    return created({ event });
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Unable to create event.",
    );
  }
}
