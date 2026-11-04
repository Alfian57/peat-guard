import { FIRMS_SOURCES } from "@/lib/firms-sources";
import type {
  PublicMapConfidenceFilter,
  PublicMapSourceFilter,
} from "@/lib/public/contracts";
import type { MapViewport } from "@/lib/maps/types";

export const PUBLIC_DEFAULT_VIEWPORT: MapViewport = {
  west: 108,
  south: -6,
  east: 119,
  north: 4,
};

export const MAX_PUBLIC_RESULT_LIMIT = 500;
export const MAX_PUBLIC_ZONE_LIMIT = 100;

export type PublicMapPeriod = "24h" | "7d" | "30d" | "all";

export type PublicMapQuery = {
  viewport: MapViewport;
  period: PublicMapPeriod;
  source: PublicMapSourceFilter;
  confidence: PublicMapConfidenceFilter;
  limit: number;
};

export type PublicMapQueryResult =
  | { success: true; data: PublicMapQuery }
  | { success: false; code: "invalid_query" };

const ALLOWED_PARAMETERS = new Set([
  "bbox",
  "period",
  "source",
  "confidence",
  "limit",
]);
const ALLOWED_PERIODS = new Set<PublicMapPeriod>(["24h", "7d", "30d", "all"]);
const ALLOWED_CONFIDENCE = new Set<PublicMapConfidenceFilter>([
  "all",
  "low",
  "nominal",
  "high",
  "numeric",
  "unknown",
]);

export function parsePublicMapQuery(
  searchParams: URLSearchParams,
): PublicMapQueryResult {
  for (const [key] of searchParams) {
    if (!ALLOWED_PARAMETERS.has(key) || searchParams.getAll(key).length !== 1) {
      return { success: false, code: "invalid_query" };
    }
  }

  const bboxValue = searchParams.get("bbox");
  const viewport = bboxValue
    ? parseViewport(bboxValue)
    : PUBLIC_DEFAULT_VIEWPORT;
  const periodValue = searchParams.get("period") ?? "7d";
  const sourceValue = searchParams.get("source") ?? "all";
  const confidenceValue = searchParams.get("confidence") ?? "all";
  const limitValue =
    searchParams.get("limit") ?? String(MAX_PUBLIC_RESULT_LIMIT);
  const limit = parseLimit(limitValue);

  if (
    !viewport ||
    !ALLOWED_PERIODS.has(periodValue as PublicMapPeriod) ||
    !isAllowedSource(sourceValue) ||
    !ALLOWED_CONFIDENCE.has(confidenceValue as PublicMapConfidenceFilter) ||
    limit === null
  ) {
    return { success: false, code: "invalid_query" };
  }

  return {
    success: true,
    data: {
      viewport,
      period: periodValue as PublicMapPeriod,
      source: sourceValue,
      confidence: confidenceValue as PublicMapConfidenceFilter,
      limit,
    },
  };
}

function isAllowedSource(value: string): value is PublicMapSourceFilter {
  return value === "all" || value === "demo" || isFirmsSource(value);
}

function isFirmsSource(value: string): value is (typeof FIRMS_SOURCES)[number] {
  return (FIRMS_SOURCES as readonly string[]).includes(value);
}

function parseLimit(value: string): number | null {
  if (!/^[1-9]\d{0,2}$/.test(value)) {
    return null;
  }

  const limit = Number(value);
  return limit <= MAX_PUBLIC_RESULT_LIMIT ? limit : null;
}

function parseViewport(value: string): MapViewport | null {
  const parts = value.split(",");

  if (parts.length !== 4 || parts.some((part) => part.trim() === "")) {
    return null;
  }

  const [west, south, east, north] = parts.map(Number);

  if (
    ![west, south, east, north].every(Number.isFinite) ||
    west < -180 ||
    east > 180 ||
    south < -90 ||
    north > 90 ||
    west >= east ||
    south >= north ||
    east - west > 20 ||
    north - south > 15
  ) {
    return null;
  }

  return { west, south, east, north };
}
