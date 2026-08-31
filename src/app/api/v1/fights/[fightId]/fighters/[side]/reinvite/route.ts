import {
  badRequest,
  notFound,
  ok,
  unauthorized,
} from "@/lib/api/response";
import { getAuthenticatedUser } from "@/server/services/session.service";
import { reinviteFightSideById } from "@/server/services/fights.service";

function isFightSide(value: string): value is "fighterA" | "fighterB" {
  return value === "fighterA" || value === "fighterB";
}

export async function POST(
  _request: Request,
  context: RouteContext<"/api/v1/fights/[fightId]/fighters/[side]/reinvite">,
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

    const invite = await reinviteFightSideById({
      fightId,
      side,
      invitedBy: user,
    });

    return ok({ invite });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to re-invite fighter.";

    if (message === "Fight was not found.") {
      return notFound(message);
    }

    return badRequest(message);
  }
}
