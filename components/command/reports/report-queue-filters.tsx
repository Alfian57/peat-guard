"use client";

import { useState, type FormEvent } from "react";
import { Filter } from "lucide-react";
import type { CommandZone } from "@/lib/server/zones/data";
import type { ReportFilters } from "@/components/command/reports/report-query";
import { ReportQueueFilterDialog } from "@/components/command/reports/report-queue-filter-dialog";
import { ReportQueueActiveFilterTags } from "@/components/command/reports/report-queue-active-filter-tags";
import { APP_ROUTES } from "@/lib/routes";

export function ReportQueueFilters({
  draftFilters,
  error,
  isLoading,
  onApply,
  onDraftChange,
  onReset,
  resetFiltersHref,
  zones,
}: {
  draftFilters: ReportFilters;
  error: string;
  isLoading: boolean;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
  onDraftChange: (filters: ReportFilters) => void;
  onReset: () => void;
  resetFiltersHref?: string;
  zones: CommandZone[];
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const activeFiltersCount =
    (draftFilters.status ? 1 : 0) +
    (draftFilters.zoneId ? 1 : 0) +
    (draftFilters.from ? 1 : 0) +
    (draftFilters.to ? 1 : 0) +
    (draftFilters.isDemoSample && draftFilters.isDemoSample !== "all" ? 1 : 0);

  const computedResetHref = resetFiltersHref ?? APP_ROUTES.command.reports;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
          {activeFiltersCount > 0 ? (
            <ReportQueueActiveFilterTags
              filters={draftFilters}
              onReset={onReset}
              resetHref={computedResetHref}
              zones={zones}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Menampilkan seluruh insiden tanpa filter status, zona, atau
              rentang tanggal khusus.
            </p>
          )}
        </div>

        <button
          aria-controls="report-queue-filter-dialog"
          aria-expanded={isDialogOpen}
          aria-haspopup="dialog"
          className="inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-peat-forest/15 bg-white px-3 text-xs font-semibold text-peat-forest shadow-xs transition hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-peat-green"
          onClick={() => setIsDialogOpen(true)}
          type="button"
        >
          <Filter aria-hidden="true" size={14} />
          <span>Filter</span>
          {activeFiltersCount > 0 ? (
            <span className="grid size-4.5 min-w-4.5 place-items-center rounded-full bg-peat-green text-[10px] font-bold text-white">
              {activeFiltersCount}
            </span>
          ) : null}
        </button>
      </div>

      <ReportQueueFilterDialog
        draftFilters={draftFilters}
        error={error}
        isLoading={isLoading}
        isOpen={isDialogOpen}
        onApply={onApply}
        onClose={() => setIsDialogOpen(false)}
        onDraftChange={onDraftChange}
        zones={zones}
      />
    </div>
  );
}
