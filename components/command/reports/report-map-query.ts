import type { MapViewport } from "@/lib/maps/types";
import type { ReportStatus } from "@/components/command/reports/report-contracts";
import type { ReportUrgency } from "@/lib/generated/prisma/enums";

export type ReportMapFilters = {
  from: string;
  to: string;
  status: ReportStatus | "all";
  urgency: ReportUrgency | "UNRATED" | "all";
};

export const DEFAULT_REPORT_MAP_FILTERS: ReportMapFilters = {
  from: "",
  to: "",
  status: "all",
  urgency: "all",
};

export function buildReportMapQuery(
  viewport: MapViewport,
  filters: ReportMapFilters,
): string {
  const params = new URLSearchParams({
    west: roundCoordinate(viewport.west),
    south: roundCoordinate(viewport.south),
    east: roundCoordinate(viewport.east),
    north: roundCoordinate(viewport.north),
  });
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.urgency !== "all") params.set("urgency", filters.urgency);
  return params.toString();
}

function roundCoordinate(value: number): string {
  return value.toFixed(5);
}
