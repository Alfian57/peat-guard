import "server-only";

import {
  HandlingStatus,
  type HandlingStatus as HandlingStatusValue,
} from "@/app/generated/prisma/enums";
import {
  readBoundedRequestBody,
  ReportInputError,
} from "@/lib/server/reports/input";

export const MAX_REPORT_STATUS_REQUEST_BYTES = 4 * 1024;

export type ReportStatusUpdate = {
  expectedStatus: HandlingStatusValue;
  nextStatus: HandlingStatusValue;
  note: string | null;
};

function isHandlingStatus(value: unknown): value is HandlingStatusValue {
  return (
    typeof value === "string" &&
    Object.values(HandlingStatus).some((status) => status === value)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseReportStatusUpdate(value: unknown): ReportStatusUpdate {
  if (!isRecord(value)) {
    throw new ReportInputError(
      400,
      "A report status update object is required.",
    );
  }

  const expectedStatus = value.expectedStatus;
  const nextStatus = value.nextStatus;
  const note = value.note;

  if (!isHandlingStatus(expectedStatus) || !isHandlingStatus(nextStatus)) {
    throw new ReportInputError(
      400,
      "Expected and next status values are required.",
    );
  }

  if (expectedStatus === nextStatus) {
    throw new ReportInputError(400, "The report status must change.");
  }

  if (note !== undefined && (typeof note !== "string" || note.length > 500)) {
    throw new ReportInputError(
      400,
      "The status note must be at most 500 characters.",
    );
  }

  return {
    expectedStatus,
    nextStatus,
    note: typeof note === "string" ? note.trim() || null : null,
  };
}

export async function readReportStatusUpdate(
  request: Request,
): Promise<ReportStatusUpdate> {
  const bytes = await readBoundedRequestBody(
    request,
    MAX_REPORT_STATUS_REQUEST_BYTES,
    "The status request exceeds the size limit.",
  );

  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ReportInputError(400, "The status update body is invalid JSON.");
  }

  return parseReportStatusUpdate(body);
}
