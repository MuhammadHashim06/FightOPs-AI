import {
  badRequest,
  conflict,
  serverError,
  unauthorized,
} from "@/lib/api/response";

export function handleAuthRouteError(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error.";

  if (message === "Invalid email or password.") {
    return unauthorized(message);
  }

  if (message === "An account with this email already exists.") {
    return conflict(message);
  }

  if (message.includes("already linked")) {
    return conflict(message);
  }

  if (
    message.includes("required") ||
    message.includes("invalid") ||
    message.includes("expired") ||
    message.includes("match") ||
    message.includes("at least")
  ) {
    return badRequest(message);
  }

  return serverError(message);
}
