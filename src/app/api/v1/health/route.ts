import { ok } from "@/lib/api/response";
import { getHealthStatus } from "@/server/services/health.service";

export async function GET() {
  return ok(getHealthStatus());
}
