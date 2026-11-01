import "server-only";

import { AuthorizationError } from "@/lib/role-access";
import { ReportInputError } from "@/lib/server/reports/input";
import { ReportPhotoError } from "@/lib/server/uploads/private-photo";
import type { HandlingStatus } from "@/app/generated/prisma/client";

export const PRIVATE_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  Pragma: "no-cache",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
} as const;

export class ReportNotFoundError extends Error {
  constructor() {
    super("The report was not found.");
    this.name = "ReportNotFoundError";
  }
}

export class ReportStateConflictError extends Error {
  constructor(readonly currentStatus: HandlingStatus) {
    super("The report status changed before this update was applied.");
    this.name = "ReportStateConflictError";
  }
}

export function privateJsonResponse(payload: unknown, status = 200): Response {
  return Response.json(payload, {
    status,
    headers: PRIVATE_RESPONSE_HEADERS,
  });
}

export function reportErrorResponse(error: unknown): Response {
  if (error instanceof AuthorizationError) {
    return privateJsonResponse({ error: error.message }, error.status);
  }

  if (error instanceof ReportInputError || error instanceof ReportPhotoError) {
    return privateJsonResponse({ error: error.message }, error.status);
  }

  if (error instanceof ReportNotFoundError) {
    return privateJsonResponse({ error: "Laporan tidak ditemukan." }, 404);
  }

  if (error instanceof ReportStateConflictError) {
    return privateJsonResponse(
      {
        error: "Status laporan sudah berubah. Muat ulang sebelum mencoba lagi.",
        currentStatus: error.currentStatus,
      },
      409,
    );
  }

  return privateJsonResponse(
    { error: "Laporan belum dapat diproses. Silakan coba lagi." },
    503,
  );
}
