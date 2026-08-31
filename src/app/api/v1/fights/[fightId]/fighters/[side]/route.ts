import {
  badRequest,
  notFound,
  ok,
  unauthorized,
} from "@/lib/api/response";
import { getAuthenticatedUser } from "@/server/services/session.service";
import {
  removeFightSideById,
  saveFightSideById,
} from "@/server/services/fights.service";
import type { CreateFighterInput } from "@/types/event";

function isFightSide(value: string): value is "fighterA" | "fighterB" {
  return value === "fighterA" || value === "fighterB";
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/v1/fights/[fightId]/fighters/[side]">,
) {
  return saveFightSide(request, context);
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/v1/fights/[fightId]/fighters/[side]">,
) {
  return saveFightSide(request, context);
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/v1/fights/[fightId]/fighters/[side]">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  try {
    const { fightId, side } = await context.params;

    if (!isFightSide(side)) {
      return badRequest("Invalid fight side.");
    }

    const fight = await removeFightSideById({ fightId, side });
    return ok({ fight });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove fighter.";

    if (message === "Fight was not found.") {
      return notFound(message);
    }

    return badRequest(message);
  }
}

async function saveFightSide(
  request: Request,
  context: RouteContext<"/api/v1/fights/[fightId]/fighters/[side]">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  try {
    const { fightId, side } = await context.params;

    if (!isFightSide(side)) {
      return badRequest("Invalid fight side.");
    }

    const body = (await request.json()) as CreateFighterInput;
    const result = await saveFightSideById({
      fightId,
      side,
      fighter: body,
      invitedBy: user,
    });

    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save fighter.";

    if (message === "Fight was not found.") {
      return notFound(message);
    }

    return badRequest(message);
  }
}
