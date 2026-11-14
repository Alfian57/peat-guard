"use client";

import { useState, type FormEvent } from "react";
import { Filter } from "lucide-react";

import { LayerCheckbox } from "@/components/command/map/layer-checkbox";
import { ReportMapLegendItem } from "@/components/command/map/report-map-legend-item";
import { ReportMapFilterDialog } from "@/components/command/map/report-map-filter-dialog";
import { ReportMapActiveFilterTags } from "@/components/command/map/report-map-active-filter-tags";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReportMapFilters } from "@/components/command/reports/report-map-query";

export type ReportMapLoadState = "idle" | "loading" | "ready" | "error";

export type ReportMapControlsProps = {
  draftFilters: ReportMapFilters;
  appliedFilters: ReportMapFilters;
  error: string;
  filtersError: string;
  isVisible: boolean;
  limit: number | null;
  loadState: ReportMapLoadState;
  onApply: (event: FormEvent<HTMLFormElement>) => boolean;
  onDiscardDraft: () => void;
  onDraftChange: (filters: ReportMapFilters) => void;
  onReset: () => void;
  onRetry: () => void;
  onVisibilityChange: (visible: boolean) => void;
  pointCount: number | undefined;
  truncated: boolean;
};

export function ReportMapControls({
  draftFilters,
  appliedFilters,
  error,
  filtersError,
  isVisible,
  limit,
  loadState,
  onApply,
  onDiscardDraft,
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
    (appliedFilters.from ? 1 : 0) +
    (appliedFilters.to ? 1 : 0) +
    (appliedFilters.status !== "all" ? 1 : 0) +
    (appliedFilters.urgency !== "all" ? 1 : 0);

  return (
    <section
      aria-labelledby="map-reports-heading"
      className="border-t border-peat-forest/10 pt-5"
    >
      <h2
        className="text-sm font-semibold text-peat-forest"
        id="map-reports-heading"
      >
        Laporan lapangan
      </h2>
      <div className="mt-1">
        <LayerCheckbox
          checked={isVisible}
          label="Tampilkan pin laporan"
          onChange={onVisibilityChange}
          swatch="bg-red-600"
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {activeFiltersCount > 0 ? (
            <ReportMapActiveFilterTags
              filters={appliedFilters}
              onReset={onReset}
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              Semua pin laporan
            </span>
          )}
        </div>

        <button
          aria-controls="report-map-filter-dialog"
          aria-expanded={isDialogOpen}
          aria-haspopup="dialog"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-peat-forest/15 bg-white px-3 text-xs font-semibold text-peat-forest transition-colors hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
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

      <div
        aria-label="Keterangan warna status pin laporan"
        className="mt-4"
        role="group"
      >
        <h3 className="text-xs font-semibold text-peat-forest">
          Warna pin menurut triase dan status
        </h3>
        <ul className="mt-2 grid grid-cols-2 gap-2 text-xs text-peat-forest/75">
          <ReportMapLegendItem color="bg-red-600" label="Urgensi AI kritis" />
          <ReportMapLegendItem
            color="bg-amber-600"
            label="Urgensi AI waspada"
          />
          <ReportMapLegendItem
            color="bg-emerald-700"
            label="Aman / terkendali atau selesai"
          />
          <ReportMapLegendItem
            color="bg-slate-500"
            label="Urgensi AI rendah / belum dinilai"
          />
        </ul>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Kategori aman atau status selesai memakai pin hijau meskipun urgensi
          AI tinggi.
        </p>
      </div>

      <div aria-live="polite" className="mt-3">
        {loadState === "idle" ? (
          <p className="text-xs leading-5 text-muted-foreground">
            Laporan akan dimuat untuk area yang terlihat pada peta.
          </p>
        ) : loadState === "loading" ? (
          <div
            aria-busy="true"
            aria-label="Memuat laporan pada area peta"
            className="flex h-5 items-center"
            role="status"
          >
            <Skeleton className="h-3 w-44 rounded-md bg-peat-forest/10" />
          </div>
        ) : loadState === "error" ? (
          <div className="space-y-2">
            <p className="text-sm leading-5 text-red-800" role="alert">
              {error}
            </p>
            <button
              className="min-h-11 rounded-lg border border-peat-forest/15 px-3 text-xs font-semibold text-peat-forest hover:bg-peat-paper"
              onClick={onRetry}
              type="button"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs leading-5 text-muted-foreground">
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
        onApply={(event) => {
          if (onApply(event)) setIsDialogOpen(false);
        }}
        onClose={() => {
          onDiscardDraft();
          setIsDialogOpen(false);
        }}
        onDraftChange={onDraftChange}
      />
    </section>
  );
}
