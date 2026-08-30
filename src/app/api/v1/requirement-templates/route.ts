import { badRequest, created, ok, unauthorized } from "@/lib/api/response";
import {
  createRequirementTemplateForUser,
  listRequirementTemplatesForUser,
} from "@/server/services/requirement-templates.service";
import { getAuthenticatedUser } from "@/server/services/session.service";
import type { CreateRequirementTemplateInput } from "@/types/readiness";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  const templates = await listRequirementTemplatesForUser(user.id);
  return ok({ templates });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as CreateRequirementTemplateInput;
    const template = await createRequirementTemplateForUser(user.id, body);
    return created({ template });
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Unable to create requirement template.",
    );
  }
}
