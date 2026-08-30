import { ok } from "@/lib/api/response";
import { resetPassword } from "@/server/services/auth.service";

import { handleAuthRouteError } from "../_lib/route";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await resetPassword(body);

    return ok({
      status: "password_reset",
      redirectTo: "/auth/sign-in?reset=success",
    });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
