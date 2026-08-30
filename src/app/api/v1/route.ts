import { ok } from "@/lib/api/response";
import { API_PREFIX, API_VERSION } from "@/lib/constants/api";

export async function GET() {
  return ok({
    version: API_VERSION,
    basePath: API_PREFIX,
    resources: [
      `${API_PREFIX}/health`,
      `${API_PREFIX}/events`,
      `${API_PREFIX}/events/[eventId]`,
      `${API_PREFIX}/events/[eventId]/requirements`,
      `${API_PREFIX}/events/[eventId]/reminders`,
      `${API_PREFIX}/events/[eventId]/fighters/[fighterId]/readiness`,
      `${API_PREFIX}/requirement-templates`,
      `${API_PREFIX}/requirement-templates/[templateId]`,
      `${API_PREFIX}/fights`,
      `${API_PREFIX}/fights/[fightId]`,
    ],
  });
}
