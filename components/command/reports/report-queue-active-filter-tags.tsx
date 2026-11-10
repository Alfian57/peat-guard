"use client";

import { Calendar, Layers, Sparkles, X } from "lucide-react";
import type { CommandZone } from "@/lib/server/zones/data";
import type { ReportFilters } from "@/components/command/reports/report-query";

export type ReportQueueActiveFilterTagsProps = {
  filters: ReportFilters;
  onReset: () => void;
  zones: CommandZone[];
};

export function ReportQueueActiveFilterTags({
  filters,
  onReset,
  zones,
}: ReportQueueActiveFilterTagsProps) {
  const selectedZone = zones.find((z) => z.id === filters.zoneId);
  const hasActiveFilters = Boolean(
    filters.zoneId ||
    filters.from ||
    filters.to ||
    (filters.isDemoSample && filters.isDemoSample !== "all"),
  );

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {selectedZone ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-peat-forest/15 bg-white px-2.5 py-1 text-peat-forest shadow-xs">
          <Layers aria-hidden="true" className="text-peat-green" size={13} />
          <span>Zona: {selectedZone.name}</span>
        </span>
      ) : null}

      {filters.from || filters.to ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-peat-forest/15 bg-white px-2.5 py-1 text-peat-forest shadow-xs">
          <Calendar aria-hidden="true" className="text-peat-green" size={13} />
          <span>
            {filters.from ? `Dari ${filters.from}` : "Awal"} –{" "}
            {filters.to ? `Sampai ${filters.to}` : "Sekarang"}
          </span>
        </span>
      ) : null}

      {filters.isDemoSample && filters.isDemoSample !== "all" ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-peat-forest/15 bg-white px-2.5 py-1 text-peat-forest shadow-xs">
          <Sparkles aria-hidden="true" className="text-peat-sun" size={13} />
          <span>
            {filters.isDemoSample === "true" ? "Sampel demo" : "Operasional"}
          </span>
        </span>
      ) : null}

      <button
        className="inline-flex min-h-7 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-foreground transition hover:text-red-700"
        onClick={onReset}
        type="button"
      >
        <X aria-hidden="true" size={13} />
        Hapus filter
      </button>
    </div>
  );
}
