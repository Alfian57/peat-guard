import type { FormEvent } from "react";

import { LayerCheckbox } from "@/components/command/map/layer-checkbox";
import { ReportMapControlField } from "@/components/command/map/report-map-control-field";
import { ReportMapLegendItem } from "@/components/command/map/report-map-legend-item";
import {
  REPORT_STATUSES,
  type ReportStatus,
} from "@/components/command/reports/report-contracts";
import {
  statusLabel,
  urgencyLabel,
} from "@/components/command/reports/report-status-badge";
import type { ReportMapFilters } from "@/components/command/reports/report-map-query";
import type { ReportUrgency } from "@/lib/generated/prisma/enums";

const REPORT_URGENCIES: ReportUrgency[] = ["KRITIS", "WASPADA", "RENDAH"];

const controlClassName =
  "min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 text-sm text-peat-forest";

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
  const isLoading = loadState === "loading";

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

      <form className="mt-3 space-y-3" onSubmit={onApply}>
        <ReportMapControlField
          hint="Tanggal rekam WIB, termasuk hari itu"
          label="Dari tanggal"
        >
          <input
            className={controlClassName + " font-mono"}
            max={draftFilters.to || undefined}
            onChange={(event) =>
              onDraftChange({
                ...draftFilters,
                from: event.currentTarget.value,
              })
            }
            type="date"
            value={draftFilters.from}
          />
        </ReportMapControlField>
        <ReportMapControlField
          hint="Tanggal rekam WIB, termasuk hari itu"
          label="Sampai tanggal"
        >
          <input
            className={controlClassName + " font-mono"}
            min={draftFilters.from || undefined}
            onChange={(event) =>
              onDraftChange({ ...draftFilters, to: event.currentTarget.value })
            }
            type="date"
            value={draftFilters.to}
          />
        </ReportMapControlField>
        <ReportMapControlField label="Status penanganan">
          <select
            className={controlClassName}
            onChange={(event) =>
              onDraftChange({
                ...draftFilters,
                status: event.currentTarget.value as ReportStatus | "all",
              })
            }
            value={draftFilters.status}
          >
            <option value="all">Semua status</option>
            {REPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </ReportMapControlField>
        <ReportMapControlField label="Urgensi AI">
          <select
            className={controlClassName}
            onChange={(event) =>
              onDraftChange({
                ...draftFilters,
                urgency: event.currentTarget
                  .value as ReportMapFilters["urgency"],
              })
            }
            value={draftFilters.urgency}
          >
            <option value="all">Semua urgensi</option>
            {REPORT_URGENCIES.map((urgency) => (
              <option key={urgency} value={urgency}>
                {urgencyLabel(urgency)}
              </option>
            ))}
            <option value="UNRATED">Belum dinilai</option>
          </select>
        </ReportMapControlField>
        {filtersError ? (
          <p className="text-sm text-red-800" role="alert">
            {filtersError}
          </p>
        ) : null}
        <div
          aria-label="Keterangan warna status pin laporan"
          className="rounded-xl bg-peat-paper p-3"
          role="group"
        >
          <h3 className="text-xs font-semibold text-peat-forest">
            Warna pin laporan
          </h3>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-xs text-peat-forest/75">
            <ReportMapLegendItem color="bg-red-600" label="Kritis" />
            <ReportMapLegendItem color="bg-amber-600" label="Waspada" />
            <ReportMapLegendItem
              color="bg-emerald-700"
              label="Aman / selesai"
            />
            <ReportMapLegendItem
              color="bg-slate-500"
              label="Rendah / belum dinilai"
            />
          </ul>
        </div>
        <div className="flex gap-2">
          <button
            className="min-h-11 flex-1 rounded-xl border border-peat-forest/15 px-3 text-sm font-semibold text-peat-forest hover:bg-peat-paper disabled:opacity-60"
            disabled={isLoading}
            onClick={onReset}
            type="button"
          >
            Atur ulang
          </button>
          <button
            className="min-h-11 flex-1 rounded-xl bg-peat-forest px-3 text-sm font-semibold text-white hover:bg-peat-green disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            Terapkan
          </button>
        </div>
      </form>

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
    </section>
  );
}
