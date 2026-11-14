import type { ServerReportSummary } from "@/lib/client/offline/server-report-client";
import { reportCategoryLabel } from "@/lib/report-labels";

export function formatCapturedAt(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function reportSummaryTitle(report: ServerReportSummary): string {
  return report.aiCategory
    ? reportCategoryLabel(report.aiCategory)
    : "Laporan patroli";
}
