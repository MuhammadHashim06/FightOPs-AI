import {
  badRequest,
  notFound,
  ok,
  unauthorized,
} from "@/lib/api/response";
import { getAuthenticatedUser } from "@/server/services/session.service";
import {
  deleteFightById,
  findFightById,
  updateFightById,
} from "@/server/services/fights.service";
import type { UpdateFightInput } from "@/types/event";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/v1/fights/[fightId]">,
) {
  const { fightId } = await context.params;
  const fight = await findFightById(fightId);

  if (!fight) {
    return notFound(`Fight '${fightId}' was not found.`);
  }

  return ok({ fight });
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/v1/fights/[fightId]">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  try {
    const { fightId } = await context.params;
    const body = (await request.json()) as UpdateFightInput;
    const fight = await updateFightById(fightId, body, user);
    return ok({ fight });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update fight.";

    if (message === "Fight was not found.") {
      return notFound(message);
    }

    return badRequest(message);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/v1/fights/[fightId]">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  try {
    const { fightId } = await context.params;
    const fight = await deleteFightById(fightId);
    return ok({ fight });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete fight.";

    if (message === "Fight was not found.") {
      return notFound(message);
    }

    return badRequest(message);
  }
}
