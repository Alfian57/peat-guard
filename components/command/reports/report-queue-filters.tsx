"use client";

import { useState, type FormEvent } from "react";
import { Filter } from "lucide-react";
import type { CommandZone } from "@/lib/server/zones/data";
import type { ReportFilters } from "@/components/command/reports/report-query";
import type { ReportStatus } from "@/components/command/reports/report-contracts";
import { statusLabel } from "@/components/command/reports/report-status-badge";
import { REPORT_STATUSES } from "@/components/command/reports/report-contracts";
import { ReportQueueStatusTab } from "@/components/command/reports/report-queue-status-tab";
import { ReportQueueFilterDialog } from "@/components/command/reports/report-queue-filter-dialog";
import { ReportQueueActiveFilterTags } from "@/components/command/reports/report-queue-active-filter-tags";

export type ReportStatusCounts = Record<ReportStatus | "all", number | null>;

export function ReportQueueFilters({
  counts,
  draftFilters,
  error,
  isLoading,
  onApply,
  onDraftChange,
  onReset,
  onStatusChange,
  selectedStatus,
  zones,
}: {
  counts: ReportStatusCounts;
  draftFilters: ReportFilters;
  error: string;
  isLoading: boolean;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
  onDraftChange: (filters: ReportFilters) => void;
  onReset: () => void;
  onStatusChange: (status: ReportStatus | null) => void;
  selectedStatus: ReportStatus | null;
  zones: CommandZone[];
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const activeFiltersCount =
    (draftFilters.zoneId ? 1 : 0) +
    (draftFilters.from ? 1 : 0) +
    (draftFilters.to ? 1 : 0) +
    (draftFilters.isDemoSample && draftFilters.isDemoSample !== "all" ? 1 : 0);

  return (
    <div className="space-y-3">
      <div
        aria-label="Filter status laporan"
        className="grid grid-cols-2 gap-2 rounded-2xl border border-peat-forest/10 bg-white p-2 sm:grid-cols-4"
        role="group"
      >
        <ReportQueueStatusTab
          count={counts.all}
          isSelected={selectedStatus === null}
          label="Semua laporan"
          onSelect={() => onStatusChange(null)}
        />
        {REPORT_STATUSES.map((status) => (
          <ReportQueueStatusTab
            count={counts[status]}
            isSelected={selectedStatus === status}
            key={status}
            label={statusLabel(status)}
            onSelect={() => onStatusChange(status)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-peat-forest/10 bg-white p-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            aria-controls="report-queue-filter-dialog"
            aria-expanded={isDialogOpen}
            aria-haspopup="dialog"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-peat-forest/15 bg-white px-4 text-sm font-semibold text-peat-forest transition hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={() => setIsDialogOpen(true)}
            type="button"
          >
            <Filter aria-hidden="true" size={17} />
            <span>Filter insiden</span>
            {activeFiltersCount > 0 ? (
              <span className="grid size-5 place-items-center rounded-full bg-peat-green text-[11px] font-bold text-white">
                {activeFiltersCount}
              </span>
            ) : null}
          </button>

          <ReportQueueActiveFilterTags
            filters={draftFilters}
            onReset={onReset}
            zones={zones}
          />
        </div>

        {activeFiltersCount === 0 ? (
          <p className="hidden text-xs text-muted-foreground sm:block">
            Menampilkan seluruh insiden tanpa filter zona atau rentang tanggal
            khusus.
          </p>
        ) : null}
      </div>

      <ReportQueueFilterDialog
        draftFilters={draftFilters}
        error={error}
        isLoading={isLoading}
        isOpen={isDialogOpen}
        onApply={onApply}
        onClose={() => setIsDialogOpen(false)}
        onDraftChange={onDraftChange}
        onReset={onReset}
        zones={zones}
      />
    </div>
  );
}
