import { ok } from "@/lib/api/response";
import {
  getRequestIpAddress,
  resolveRedirectTarget,
  setSessionCookie,
} from "@/server/security/session";
import { toSafeAuthUser } from "@/server/services/auth-presenter";
import { loginUser } from "@/server/services/auth.service";

import { handleAuthRouteError } from "../_lib/route";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await loginUser(body, {
      userAgent: request.headers.get("user-agent"),
      ipAddress: getRequestIpAddress(request),
    });
    const redirectTo = resolveRedirectTarget(
      typeof body.redirectTo === "string" ? body.redirectTo : null,
    );

    if (result.status === "verification_required") {
      return ok({
        status: result.status,
        email: result.user.email,
        redirectTo: `/auth/verify-email?email=${encodeURIComponent(
          result.user.email,
        )}&redirectTo=${encodeURIComponent(redirectTo)}`,
      });
    }

    const response = ok({
      status: result.status,
      user: toSafeAuthUser(result.user),
      redirectTo,
    });
    setSessionCookie(response, result.sessionToken);

    return response;
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
