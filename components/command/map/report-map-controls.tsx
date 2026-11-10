"use client";

import { useState, type FormEvent } from "react";
import { Filter } from "lucide-react";

import { LayerCheckbox } from "@/components/command/map/layer-checkbox";
import { ReportMapLegendItem } from "@/components/command/map/report-map-legend-item";
import { ReportMapFilterDialog } from "@/components/command/map/report-map-filter-dialog";
import { ReportMapActiveFilterTags } from "@/components/command/map/report-map-active-filter-tags";
import type { ReportMapFilters } from "@/components/command/reports/report-map-query";

export type ReportMapLoadState = "idle" | "loading" | "ready" | "error";

export type ReportMapControlsProps = {
  draftFilters: ReportMapFilters;
  error: string;
  filtersError: string;
  isVisible: boolean;
  limit: number | null;
  loadState: ReportMapLoadState;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
  onDraftChange: (filters: ReportMapFilters) => void;
  onReset: () => void;
  onRetry: () => void;
  onVisibilityChange: (visible: boolean) => void;
  pointCount: number | undefined;
  truncated: boolean;
};

export function ReportMapControls({
  draftFilters,
  error,
  filtersError,
  isVisible,
  limit,
  loadState,
  onApply,
  onDraftChange,
  onReset,
  onRetry,
  onVisibilityChange,
  pointCount,
  truncated,
}: ReportMapControlsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isLoading = loadState === "loading";

  const activeFiltersCount =
    (draftFilters.from ? 1 : 0) +
    (draftFilters.to ? 1 : 0) +
    (draftFilters.status && draftFilters.status !== "all" ? 1 : 0) +
    (draftFilters.urgency && draftFilters.urgency !== "all" ? 1 : 0);

  return (
    <section
      aria-labelledby="map-reports-heading"
      className="rounded-2xl border border-peat-forest/10 bg-white p-4"
    >
      <h2
        className="font-heading text-2xl font-bold text-peat-forest"
        id="map-reports-heading"
      >
        Laporan lapangan
      </h2>
      <div className="mt-3">
        <LayerCheckbox
          checked={isVisible}
          label="Tampilkan pin laporan"
          onChange={onVisibilityChange}
          swatch="bg-red-600"
        />
      </div>

      <div className="mt-3.5 space-y-2.5">
        <button
          aria-controls="report-map-filter-dialog"
          aria-expanded={isDialogOpen}
          aria-haspopup="dialog"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-peat-forest/15 bg-white px-3 text-sm font-semibold text-peat-forest transition hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={() => setIsDialogOpen(true)}
          type="button"
        >
          <Filter aria-hidden="true" size={17} />
          <span>Filter pin laporan</span>
          {activeFiltersCount > 0 ? (
            <span className="grid size-5 place-items-center rounded-full bg-peat-green text-[11px] font-bold text-white">
              {activeFiltersCount}
            </span>
          ) : null}
        </button>

        <ReportMapActiveFilterTags filters={draftFilters} onReset={onReset} />
      </div>

      <div
        aria-label="Keterangan warna status pin laporan"
        className="mt-3.5 rounded-xl bg-peat-paper p-3"
        role="group"
      >
        <h3 className="text-xs font-semibold text-peat-forest">
          Warna pin laporan
        </h3>
        <ul className="mt-2 grid grid-cols-2 gap-2 text-xs text-peat-forest/75">
          <ReportMapLegendItem color="bg-red-600" label="Kritis" />
          <ReportMapLegendItem color="bg-amber-600" label="Waspada" />
          <ReportMapLegendItem color="bg-emerald-700" label="Aman / selesai" />
          <ReportMapLegendItem
            color="bg-slate-500"
            label="Rendah / belum dinilai"
          />
        </ul>
      </div>

      <div
        aria-live="polite"
        className="mt-4 border-t border-peat-forest/10 pt-3"
      >
        {loadState === "idle" ? (
          <p className="text-sm leading-5 text-peat-forest/65">
            Laporan akan dimuat untuk area yang terlihat pada peta.
          </p>
        ) : loadState === "loading" ? (
          <p className="text-sm text-peat-forest/65" role="status">
            Memuat laporan pada area peta…
          </p>
        ) : loadState === "error" ? (
          <div className="space-y-2">
            <p className="text-sm leading-5 text-red-800" role="alert">
              {error}
            </p>
            <button
              className="min-h-10 rounded-lg border border-peat-forest/15 px-3 text-sm font-semibold text-peat-forest hover:bg-peat-paper"
              onClick={onRetry}
              type="button"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm leading-5 text-peat-forest/70">
              {truncated
                ? `Menampilkan ${limit ?? pointCount}+ laporan terbaru di area peta.`
                : `${pointCount ?? 0} laporan pada area peta.`}
            </p>
            {truncated ? (
              <p
                className="mt-2 rounded-lg bg-peat-sun/20 p-3 text-xs leading-5 text-peat-forest"
                role="status"
              >
                Hasil dibatasi. Zoom masuk atau geser peta untuk melihat laporan
                lain di area yang lebih kecil.
              </p>
            ) : null}
          </>
        )}
      </div>

      <ReportMapFilterDialog
        draftFilters={draftFilters}
        filtersError={filtersError}
        isLoading={isLoading}
        isOpen={isDialogOpen}
        onApply={onApply}
        onClose={() => setIsDialogOpen(false)}
        onDraftChange={onDraftChange}
        onReset={onReset}
      />
    </section>
  );
}
