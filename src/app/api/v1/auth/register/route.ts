import { created } from "@/lib/api/response";
import { toSafeAuthUser } from "@/server/services/auth-presenter";
import { registerUser } from "@/server/services/auth.service";

import { handleAuthRouteError } from "../_lib/route";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await registerUser(body);

    return created({
      status: "verification_required",
      user: toSafeAuthUser(result.user),
      email: result.user.email,
      redirectTo: `/auth/verify-email?email=${encodeURIComponent(result.user.email)}`,
    });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
