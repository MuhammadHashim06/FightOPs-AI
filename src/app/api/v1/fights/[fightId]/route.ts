import { notFound, ok } from "@/lib/api/response";
import { findFightById } from "@/server/services/fights.service";

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
