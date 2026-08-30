import { NextResponse } from "next/server";

import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

export function ok<T>(data: T, init?: ResponseInit) {
  return json<T>(data, { ...init, status: init?.status ?? 200 });
}

export function created<T>(data: T, init?: ResponseInit) {
  return json<T>(data, { ...init, status: init?.status ?? 201 });
}

export function badRequest(message: string, details?: unknown) {
  return error("BAD_REQUEST", message, 400, details);
}

export function unauthorized(message = "Unauthorized", details?: unknown) {
  return error("UNAUTHORIZED", message, 401, details);
}

export function conflict(message = "Conflict", details?: unknown) {
  return error("CONFLICT", message, 409, details);
}

export function notFound(message = "Resource not found", details?: unknown) {
  return error("NOT_FOUND", message, 404, details);
}

export function serverError(message = "Internal server error", details?: unknown) {
  return error("INTERNAL_SERVER_ERROR", message, 500, details);
}

function json<T>(data: T, init?: ResponseInit) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  return NextResponse.json(body, init);
}

function error(code: string, message: string, status: number, details?: unknown) {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };

  return NextResponse.json(body, { status });
}
