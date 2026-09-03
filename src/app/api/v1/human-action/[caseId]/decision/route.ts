import { badRequest, forbidden, notFound, ok, unauthorized } from "@/lib/api/response";
import { hasAnyRole } from "@/server/security/authorization";
import { resolveHumanActionCase } from "@/server/services/human-action.service";
import { getAuthenticatedUser } from "@/server/services/session.service";
import type { HumanActionDecision } from "@/types/human-action";

const decisions: HumanActionDecision[] = [
  "approve_extracted",
  "correct_and_accept",
  "request_resubmission",
  "request_new_file",
  "mark_not_applicable",
  "reject",
  "contact_participant",
];

export async function POST(
  request: Request,
  context: RouteContext<"/api/v1/human-action/[caseId]/decision">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  if (!hasAnyRole(user, ["admin", "promoter"])) {
    return forbidden();
  }

  try {
    const { caseId } = await context.params;
    const body = (await request.json()) as {
      decision?: HumanActionDecision;
      note?: string | null;
      correctValue?: string | null;
    };

    if (!body.decision || !decisions.includes(body.decision)) {
      return badRequest("A valid human action decision is required.");
    }

    const result = await resolveHumanActionCase({
      user,
      requirementId: caseId,
      decision: body.decision,
      note: body.note,
      correctValue: body.correctValue,
    });

    return ok({ case: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process the case.";

    if (message.includes("not found") || message.includes("already resolved")) {
      return notFound(message);
    }

    return badRequest(message);
  }
}
