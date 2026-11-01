import "server-only";

import {
  HandlingStatus,
  type HandlingStatus as HandlingStatusValue,
} from "@/app/generated/prisma/enums";
import { ReportInputError } from "@/lib/server/reports/input";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_QUERY_KEYS = new Set([
  "page",
  "pageSize",
  "status",
  "zoneId",
  "from",
  "to",
  "isDemoSample",
]);

export type ReportListFilters = {
  page: number;
  pageSize: number;
  status: HandlingStatusValue | null;
  zoneId: string | null;
  from: Date | null;
  toExclusive: Date | null;
  isDemoSample: boolean | null;
};

function parsePositiveInteger(
  params: URLSearchParams,
  name: string,
  fallback: number,
  maximum: number,
): number {
  const value = params.get(name);
  if (value === null) return fallback;

  if (!/^\d+$/.test(value)) {
    throw new ReportInputError(400, `The ${name} filter must be an integer.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new ReportInputError(
      400,
      `The ${name} filter is outside valid bounds.`,
    );
  }

  return parsed;
}

function parseCalendarDate(
  params: URLSearchParams,
  name: "from" | "to",
): Date | null {
  const value = params.get(name);
  if (value === null) return null;

  if (!DATE_PATTERN.test(value)) {
    throw new ReportInputError(
      400,
      `The ${name} filter must use YYYY-MM-DD format.`,
    );
  }

  const date = new Date(`${value}T00:00:00.000+07:00`);
  if (!Number.isFinite(date.getTime())) {
    throw new ReportInputError(400, `The ${name} filter is not a valid date.`);
  }

  const dateInWib = new Date(date.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  if (dateInWib !== value) {
    throw new ReportInputError(400, `The ${name} filter is not a valid date.`);
  }

  return date;
}

function isHandlingStatus(value: string): value is HandlingStatusValue {
  return Object.values(HandlingStatus).some((status) => status === value);
}

function parseStatus(value: string | null): HandlingStatusValue | null {
  if (value === null) return null;
  if (isHandlingStatus(value)) return value;

  throw new ReportInputError(400, "The status filter is not recognized.");
}

function parseBoolean(value: string | null, name: string): boolean | null {
  if (value === null) return null;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new ReportInputError(400, `The ${name} filter must be true or false.`);
}

export function parseReportListFilters(
  params: URLSearchParams,
): ReportListFilters {
  for (const key of params.keys()) {
    if (!ALLOWED_QUERY_KEYS.has(key)) {
      throw new ReportInputError(400, `The ${key} filter is not supported.`);
    }
    if (params.getAll(key).length !== 1) {
      throw new ReportInputError(400, `The ${key} filter must appear once.`);
    }
  }

  const page = parsePositiveInteger(params, "page", 1, 100_000);
  const pageSize = parsePositiveInteger(params, "pageSize", 25, 100);
  const status = parseStatus(params.get("status"));
  const zoneValue = params.get("zoneId");
  if (zoneValue !== null && !UUID_PATTERN.test(zoneValue)) {
    throw new ReportInputError(400, "The zoneId filter must be a UUID.");
  }

  const from = parseCalendarDate(params, "from");
  const to = parseCalendarDate(params, "to");
  if (from && to && from > to) {
    throw new ReportInputError(400, "The from filter must not follow to.");
  }

  const toExclusive = to ? new Date(to.getTime() + 24 * 60 * 60 * 1000) : null;

  return {
    page,
    pageSize,
    status,
    zoneId: zoneValue?.toLowerCase() ?? null,
    from,
    toExclusive,
    isDemoSample: parseBoolean(params.get("isDemoSample"), "isDemoSample"),
  };
}
