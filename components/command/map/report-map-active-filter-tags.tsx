"use client";

import { Calendar, ShieldAlert, Sparkles, X } from "lucide-react";
import type { ReportMapFilters } from "@/components/command/reports/report-map-query";
import {
  statusLabel,
  urgencyLabel,
} from "@/components/command/reports/report-status-badge";
import type { ReportStatus } from "@/components/command/reports/report-contracts";
import type { ReportUrgency } from "@/lib/generated/prisma/enums";

export type ReportMapActiveFilterTagsProps = {
  filters: ReportMapFilters;
  onReset: () => void;
};

export function ReportMapActiveFilterTags({
  filters,
  onReset,
}: ReportMapActiveFilterTagsProps) {
  const hasActiveFilters = Boolean(
    filters.from ||
    filters.to ||
    (filters.status && filters.status !== "all") ||
    (filters.urgency && filters.urgency !== "all"),
  );

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {filters.status && filters.status !== "all" ? (
        <span className="inline-flex items-center gap-1 rounded-md border border-peat-forest/15 bg-white px-2 py-0.5 text-peat-forest shadow-xs">
          <ShieldAlert
            aria-hidden="true"
            className="text-peat-green"
            size={12}
          />
          <span>Status: {statusLabel(filters.status as ReportStatus)}</span>
        </span>
      ) : null}

      {filters.urgency && filters.urgency !== "all" ? (
        <span className="inline-flex items-center gap-1 rounded-md border border-peat-forest/15 bg-white px-2 py-0.5 text-peat-forest shadow-xs">
          <Sparkles aria-hidden="true" className="text-amber-600" size={12} />
          <span>
            {filters.urgency === "UNRATED"
              ? "Urgensi: Belum dinilai"
              : `Urgensi: ${urgencyLabel(filters.urgency as ReportUrgency)}`}
          </span>
        </span>
      ) : null}

      {filters.from || filters.to ? (
        <span className="inline-flex items-center gap-1 rounded-md border border-peat-forest/15 bg-white px-2 py-0.5 text-peat-forest shadow-xs">
          <Calendar aria-hidden="true" className="text-peat-green" size={12} />
          <span>
            {filters.from ? `Dari ${filters.from}` : "Awal"} –{" "}
            {filters.to ? `Sampai ${filters.to}` : "Sekarang"}
          </span>
        </span>
      ) : null}

      <button
        className="inline-flex min-h-6 items-center gap-0.5 rounded px-1.5 text-[11px] font-semibold text-muted-foreground transition hover:text-red-700"
        onClick={onReset}
        type="button"
      >
        <X aria-hidden="true" size={12} />
        Reset
      </button>
    </div>
  );
}
