import { badRequest, created, unauthorized } from "@/lib/api/response";
import { uploadFighterRequirementDocument } from "@/server/services/document-submissions.service";
import { getAuthenticatedUser } from "@/server/services/session.service";

export async function POST(
  request: Request,
  context: RouteContext<"/api/v1/fighter/requirements/[requirementId]/submissions">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  try {
    const { requirementId } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return badRequest("Document file is required.");
    }

    const submission = await uploadFighterRequirementDocument({
      user,
      fighterRequirementId: requirementId,
      file,
    });

    return created({ submission });
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Unable to upload document.",
    );
  }
}
