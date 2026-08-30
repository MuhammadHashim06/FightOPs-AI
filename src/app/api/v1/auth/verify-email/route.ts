import { ok } from "@/lib/api/response";
import { resolveRedirectTarget } from "@/server/security/session";
import { toSafeAuthUser } from "@/server/services/auth-presenter";
import { verifyEmail } from "@/server/services/auth.service";

import { handleAuthRouteError } from "../_lib/route";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await verifyEmail(body);
    const redirectTo = resolveRedirectTarget(
      typeof body.redirectTo === "string" ? body.redirectTo : null,
    );

    return ok({
      status: "verified",
      user: toSafeAuthUser(result.user),
      redirectTo: `/auth/sign-in?verified=success&redirectTo=${encodeURIComponent(
        redirectTo,
      )}`,
    });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
