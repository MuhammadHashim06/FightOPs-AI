import { badRequest, ok, unauthorized } from "@/lib/api/response";
import { reviewDocumentSubmission } from "@/server/services/document-submissions.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export async function POST(
  request: Request,
  context: RouteContext<"/api/v1/document-submissions/[submissionId]/decision">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  try {
    const { submissionId } = await context.params;
    const body = (await request.json()) as {
      decision?: "accept" | "reject";
      note?: string | null;
    };

    if (body.decision !== "accept" && body.decision !== "reject") {
      return badRequest("Decision must be accept or reject.");
    }

    const submission = await reviewDocumentSubmission({
      user,
      submissionId,
      decision: body.decision,
      note: body.note,
    });

    return ok({ submission });
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Unable to review document.",
    );
  }
}
