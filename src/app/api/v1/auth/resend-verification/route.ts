import { ok } from "@/lib/api/response";
import { resendVerification } from "@/server/services/auth.service";

import { handleAuthRouteError } from "../_lib/route";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await resendVerification(body);

    return ok({
      status: "verification_resent",
      email: result.email,
      message: "If the account needs verification, a new code has been sent.",
    });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
