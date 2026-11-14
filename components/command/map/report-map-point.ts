import {
  HandlingStatus,
  ReportCategory,
  ReportUrgency,
} from "@/lib/generated/prisma/enums";
import type { ReportMapPoint } from "@/components/command/reports/report-contracts";
import { statusLabel } from "@/components/command/reports/report-status-badge";
import { reportCategoryLabel } from "@/lib/report-labels";
import type { MapPoint } from "@/lib/maps/types";

export function toCommandReportMapPoint(point: ReportMapPoint): MapPoint {
  const category = reportCategoryLabel(point.aiCategory);
  return {
    id: point.id,
    coordinates: [point.longitude, point.latitude],
    kind: "report",
    label: "PG-" + point.id.slice(0, 8).toUpperCase(),
    description: `${category} · ${statusLabel(point.handlingStatus)} · ${formatMapDate(point.capturedAt)}`,
    urgency: point.aiUrgency ?? undefined,
    reportPinState: getReportPinState(point),
    isDemoData: point.isDemoSample,
  };
}

export function getReportPinState(
  point: Pick<ReportMapPoint, "aiCategory" | "aiUrgency" | "handlingStatus">,
): NonNullable<MapPoint["reportPinState"]> {
  if (
    point.handlingStatus === HandlingStatus.SELESAI ||
    point.aiCategory === ReportCategory.AMAN_TERKENDALI
  ) {
    return "safe";
  }

  if (point.aiUrgency === ReportUrgency.KRITIS) return "critical";
  if (point.aiUrgency === ReportUrgency.WASPADA) return "warning";
  return "neutral";
}

function formatMapDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
