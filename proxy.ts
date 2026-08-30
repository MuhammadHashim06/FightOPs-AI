import { NextResponse, type NextRequest } from "next/server";

import {
  getDashboardPathForRole,
  getDashboardRoleFromPathname,
} from "@/features/dashboard/lib/dashboard-routes";
import {
  buildSignInRedirectTarget,
  clearSessionCookie,
  getSessionTokenFromRequest,
  resolveRedirectTarget,
} from "@/server/security/session";
import { getAuthenticatedUserFromToken } from "@/server/services/session.service";

export async function proxy(request: NextRequest) {
  const sessionToken = getSessionTokenFromRequest(request);
  const user = await getAuthenticatedUserFromToken(sessionToken);
  const { pathname, searchParams } = request.nextUrl;
  const hasStaleSession = Boolean(sessionToken) && !user;

  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const response = NextResponse.redirect(buildSignInRedirectTarget(request));

      if (hasStaleSession) {
        clearSessionCookie(response);
      }

      return response;
    }

    const expectedDashboardPath = getDashboardPathForRole(user.role);
    const dashboardRole = getDashboardRoleFromPathname(pathname);

    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return NextResponse.redirect(new URL(expectedDashboardPath, request.url));
    }

    if (dashboardRole && dashboardRole !== user.role) {
      return NextResponse.redirect(new URL(expectedDashboardPath, request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/auth") && user) {
    const destination = resolveRedirectTarget(searchParams.get("redirectTo"));
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (pathname.startsWith("/auth") && hasStaleSession) {
    const response = NextResponse.next();
    clearSessionCookie(response);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*", "/dashboard/:path*"],
};
