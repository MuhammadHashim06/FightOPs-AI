import {
  badRequest,
  forbidden,
  notFound,
  ok,
  unauthorized,
} from "@/lib/api/response";
import { getAuthenticatedUser } from "@/server/services/session.service";
import { hasAnyRole } from "@/server/security/authorization";
import {
  deleteFightById,
  findFightByIdForUser,
  updateFightById,
} from "@/server/services/fights.service";
import type { UpdateFightInput } from "@/types/event";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/v1/fights/[fightId]">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasAnyRole(user, ["promoter", "admin"])) {
    return forbidden();
  }

  const { fightId } = await context.params;
  const fight = await findFightByIdForUser(fightId, user);

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

  if (!hasAnyRole(user, ["promoter", "admin"])) {
    return forbidden();
  }

  try {
    const { fightId } = await context.params;
    const existingFight = await findFightByIdForUser(fightId, user);

    if (!existingFight) {
      return notFound("Fight was not found.");
    }

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

  if (!hasAnyRole(user, ["promoter", "admin"])) {
    return forbidden();
  }

  try {
    const { fightId } = await context.params;
    const existingFight = await findFightByIdForUser(fightId, user);

    if (!existingFight) {
      return notFound("Fight was not found.");
    }

    const fight = await deleteFightById(fightId, user.id);
    return ok({ fight });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete fight.";

    if (message === "Fight was not found.") {
      return notFound(message);
    }

    return badRequest(message);
  }
}
