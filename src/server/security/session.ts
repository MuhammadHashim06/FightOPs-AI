import { createHash, randomUUID } from "node:crypto";

import type { NextRequest, NextResponse } from "next/server";

import { env } from "@/server/config/env";

export const SESSION_COOKIE_NAME = "fightops_session";

export function createSessionToken() {
  return randomUUID();
}

export function hashSessionToken(sessionToken: string) {
  return createHash("sha256")
    .update(`${env.authSecret}:${sessionToken}`)
    .digest("hex");
}

export function setSessionCookie(response: NextResponse, sessionToken: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge: env.authRefreshTokenExpiresInDays * 24 * 60 * 60,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionTokenFromRequest(request: NextRequest) {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export function resolveRedirectTarget(
  candidate: string | null | undefined,
  fallback = "/dashboard",
) {
  if (!candidate) {
    return fallback;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  if (candidate.startsWith("/auth")) {
    return fallback;
  }

  return candidate;
}

export function buildSignInRedirectTarget(request: NextRequest) {
  const currentPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const signInUrl = new URL("/auth/sign-in", request.url);

  signInUrl.searchParams.set("redirectTo", currentPath);

  return signInUrl;
}

export function getRequestIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return request.headers.get("x-real-ip");
}
