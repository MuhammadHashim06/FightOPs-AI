import { ok } from "@/lib/api/response";
import { sendPasswordReset } from "@/server/services/auth.service";

import { handleAuthRouteError } from "../_lib/route";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await sendPasswordReset(body);

    return ok({
      status: "reset_link_sent",
      email: result.email,
      message: "If the account exists, a reset email has been sent.",
    });
  } catch (error) {
    return handleAuthRouteError(error);
  }
}
