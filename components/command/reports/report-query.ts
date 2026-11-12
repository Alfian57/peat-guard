import {
  REPORT_STATUSES,
  type ReportStatus,
} from "@/components/command/reports/report-contracts";
import { APP_ROUTES } from "@/lib/routes";

export type ReportFilters = {
  status: ReportStatus | null;
  zoneId: string;
  from: string;
  to: string;
  isDemoSample: "all" | "true" | "false";
};

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  status: null,
  zoneId: "",
  from: "",
  to: "",
  isDemoSample: "all",
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

export function parseReportQueryParams(
  params: URLSearchParams | { [key: string]: string | string[] | undefined },
): { filters: ReportFilters; page: number } {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) {
      return params.get(key);
    }
    const val = params[key];
    if (Array.isArray(val)) return val[0] ?? null;
    return typeof val === "string" ? val : null;
  };

  const rawStatus = get("status");
  const status: ReportStatus | null =
    rawStatus && (REPORT_STATUSES as readonly string[]).includes(rawStatus)
      ? (rawStatus as ReportStatus)
      : null;

  const rawPage = Number(get("page"));
  const page = Number.isSafeInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const zoneId = get("zoneId") ?? "";
  const from = get("from") ?? "";
  const to = get("to") ?? "";
  const rawDemo = get("isDemoSample");
  const isDemoSample: ReportFilters["isDemoSample"] =
    rawDemo === "true" || rawDemo === "false" ? rawDemo : "all";

  return {
    filters: {
      status,
      zoneId,
      from,
      to,
      isDemoSample,
    },
    page,
  };
}

export function buildReportQueueHref(
  filters: Partial<ReportFilters>,
  page = 1,
): string {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.zoneId) {
    params.set("zoneId", filters.zoneId);
  }
  if (filters.from) {
    params.set("from", filters.from);
  }
  if (filters.to) {
    params.set("to", filters.to);
  }
  if (filters.isDemoSample && filters.isDemoSample !== "all") {
    params.set("isDemoSample", filters.isDemoSample);
  }
  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query
    ? `${APP_ROUTES.command.reports}?${query}`
    : APP_ROUTES.command.reports;
}

export function buildStatusTabHref(
  currentFilters: ReportFilters,
  newStatus: ReportStatus | null,
): string {
  return buildReportQueueHref(
    {
      ...currentFilters,
      status: newStatus,
    },
    1,
  );
}

export function buildPageHref(
  currentFilters: ReportFilters,
  newPage: number,
): string {
  return buildReportQueueHref(currentFilters, newPage);
}
