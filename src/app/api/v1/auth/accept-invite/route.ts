import { ok } from "@/lib/api/response";
import {
  getRequestIpAddress,
  setSessionCookie,
} from "@/server/security/session";
import { toSafeAuthUser } from "@/server/services/auth-presenter";
import { acceptFighterInvite } from "@/server/services/fighter-invites.service";

import { handleAuthRouteError } from "../_lib/route";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await acceptFighterInvite(body, {
      userAgent: request.headers.get("user-agent"),
      ipAddress: getRequestIpAddress(request),
    });

    const response = ok({
      status: "invite_accepted" as const,
      user: toSafeAuthUser(result.user),
      redirectTo: result.redirectTo,
    });
    setSessionCookie(response, result.sessionToken);

    return response;
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
