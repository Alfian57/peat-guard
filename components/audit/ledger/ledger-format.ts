import type { LedgerFilters } from "@/lib/server/mrv/contracts";

export function getLedgerQuery(filters: LedgerFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.zoneId) params.set("zoneId", filters.zoneId);
  if (filters.range?.fromDate) params.set("from", filters.range.fromDate);
  if (filters.range?.toDate) params.set("to", filters.range.toDate);
  if (filters.evidence !== "all") params.set("evidence", filters.evidence);
  if (filters.aiState) params.set("aiState", filters.aiState);

  return params;
}

export function getLedgerExportHref(
  filters: LedgerFilters,
  format: "csv" | "json",
): string {
  const params = getLedgerQuery(filters);
  params.set("format", format);
  return `/api/command/mrv/ledger/export?${params.toString()}`;
}

export function getLedgerPageHref(
  filters: LedgerFilters,
  page: number,
): string {
  const params = getLedgerQuery(filters);
  params.set("page", String(page));
  params.set("pageSize", String(filters.pageSize));
  const query = params.toString();
  return query ? `/audit/ledger?${query}` : "/audit/ledger";
}
