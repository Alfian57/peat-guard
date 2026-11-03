import "server-only";

import {
  HandlingStatus,
  ReportUrgency,
  type HandlingStatus as HandlingStatusValue,
  type ReportUrgency as ReportUrgencyValue,
} from "@/app/generated/prisma/enums";
import { CommandApiError } from "@/lib/server/command/http";

const QUERY_KEYS = new Set([
  "west",
  "south",
  "east",
  "north",
  "from",
  "to",
  "status",
  "urgency",
]);
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

export type ReportMapUrgencyFilter = ReportUrgencyValue | "UNRATED" | null;

export type ReportMapFilters = {
  west: number;
  south: number;
  east: number;
  north: number;
  from: Date | null;
  toExclusive: Date | null;
  status: HandlingStatusValue | null;
  urgency: ReportMapUrgencyFilter;
};

export function parseReportMapFilters(
  params: URLSearchParams,
): ReportMapFilters {
  for (const key of params.keys()) {
    if (!QUERY_KEYS.has(key)) {
      throw invalidFilter(`The ${key} filter is not supported.`);
    }
    if (params.getAll(key).length !== 1) {
      throw invalidFilter(`The ${key} filter must appear once.`);
    }
  }

  const west = parseCoordinate(params, "west", -180, 180);
  const east = parseCoordinate(params, "east", -180, 180);
  const south = parseCoordinate(params, "south", -90, 90);
  const north = parseCoordinate(params, "north", -90, 90);
  if (west >= east || south >= north) {
    throw invalidFilter(
      "The viewport bounds must have positive width and height.",
    );
  }

  const from = parseCalendarDate(params.get("from"), "from");
  const to = parseCalendarDate(params.get("to"), "to");
  if (from && to && from > to) {
    throw invalidFilter("The from filter must not follow to.");
  }

  return {
    west,
    south,
    east,
    north,
    from,
    toExclusive: to ? new Date(to.getTime() + 24 * 60 * 60 * 1000) : null,
    status: parseStatus(params.get("status")),
    urgency: parseUrgency(params.get("urgency")),
  };
}

function parseCoordinate(
  params: URLSearchParams,
  name: "west" | "south" | "east" | "north",
  minimum: number,
  maximum: number,
): number {
  const value = params.get(name);
  if (value === null || !DECIMAL.test(value)) {
    throw invalidFilter(`The ${name} viewport bound must be a number.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw invalidFilter(`The ${name} viewport bound is outside valid bounds.`);
  }

  return parsed;
}

function parseCalendarDate(
  value: string | null,
  name: "from" | "to",
): Date | null {
  if (value === null) return null;
  if (!CALENDAR_DATE.test(value)) {
    throw invalidFilter(`The ${name} filter must use YYYY-MM-DD format.`);
  }

  const date = new Date(`${value}T00:00:00.000+07:00`);
  if (!Number.isFinite(date.getTime())) {
    throw invalidFilter(`The ${name} filter is not a valid date.`);
  }
  const dateInWib = new Date(date.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  if (dateInWib !== value) {
    throw invalidFilter(`The ${name} filter is not a valid date.`);
  }

  return date;
}

function parseStatus(value: string | null): HandlingStatusValue | null {
  if (value === null) return null;
  if (Object.values(HandlingStatus).some((status) => status === value)) {
    return value as HandlingStatusValue;
  }
  throw invalidFilter("The status filter is not recognized.");
}

function parseUrgency(value: string | null): ReportMapUrgencyFilter {
  if (value === null) return null;
  if (value === "UNRATED") return value;
  if (Object.values(ReportUrgency).some((urgency) => urgency === value)) {
    return value as ReportUrgencyValue;
  }
  throw invalidFilter("The urgency filter is not recognized.");
}

function invalidFilter(message: string): CommandApiError {
  return new CommandApiError(400, "invalid_report_map_filter", message);
}
