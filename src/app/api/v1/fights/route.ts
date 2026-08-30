import { ok } from "@/lib/api/response";
import { listFights } from "@/server/services/fights.service";

export async function GET() {
  return ok({
    fights: await listFights(),
  });
}
