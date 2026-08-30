import { cookies } from "next/headers";

import { ok } from "@/lib/api/response";
import {
  clearSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/server/security/session";
import { logoutUser } from "@/server/services/logout.service";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  await logoutUser(sessionToken);

  const response = ok({
    status: "logged_out",
    message: "You have been logged out.",
  });

  clearSessionCookie(response);

  return response;
}
