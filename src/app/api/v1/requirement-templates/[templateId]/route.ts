import { badRequest, notFound, ok, unauthorized } from "@/lib/api/response";
import {
  deleteRequirementTemplateById,
  updateRequirementTemplateById,
} from "@/server/services/requirement-templates.service";
import { getAuthenticatedUser } from "@/server/services/session.service";
import type { UpdateRequirementTemplateInput } from "@/types/readiness";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/v1/requirement-templates/[templateId]">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  try {
    const { templateId } = await context.params;
    const body = (await request.json()) as UpdateRequirementTemplateInput;
    const template = await updateRequirementTemplateById(user.id, templateId, body);

    if (!template) {
      return notFound("Requirement template was not found.");
    }

    return ok({ template });
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Unable to update requirement template.",
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/v1/requirement-templates/[templateId]">,
) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const { templateId } = await context.params;
  const deleted = await deleteRequirementTemplateById(user.id, templateId);

  if (!deleted) {
    return notFound("Requirement template was not found.");
  }

  return ok({ deleted: true });
}
