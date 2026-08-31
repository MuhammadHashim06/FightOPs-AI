"use client";

import type { ApiResponse } from "@/types/api";
import type { SafeAuthUser } from "@/types/auth";

type AuthStatus =
  | "authenticated"
  | "invite_accepted"
  | "verification_required"
  | "verified"
  | "verification_resent"
  | "reset_link_sent"
  | "password_reset";

type AuthPayload = {
  status: AuthStatus;
  redirectTo?: string;
  email?: string;
  message?: string;
  user?: SafeAuthUser;
};

export async function postAuth<TBody extends Record<string, unknown>>(
  endpoint: string,
  body: TBody,
) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as ApiResponse<AuthPayload>;

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.success ? "Something went wrong." : payload.error.message,
    );
  }

  return payload.data;
}
