import type { ReportStatus } from "@/components/command/reports/report-contracts";

export type ReportFilters = {
  status: ReportStatus | null;
  zoneId: string;
  from: string;
  to: string;
  isDemoSample: "all" | "true" | "false";
};

export function buildReportQuery(
  filters: ReportFilters,
  page: number,
  pageSize = 25,
): string {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (filters.status) params.set("status", filters.status);
  if (filters.zoneId) params.set("zoneId", filters.zoneId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.isDemoSample !== "all") {
    params.set("isDemoSample", filters.isDemoSample);
  }
  return params.toString();
}
