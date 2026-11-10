import type {
  PublicMapConfidenceFilter,
  PublicMapSourceFilter,
} from "@/lib/public/contracts";
import type { PublicMapPeriod } from "@/lib/public/query";

export type PublicMapFilters = {
  period: PublicMapPeriod;
  source: PublicMapSourceFilter;
  confidence: PublicMapConfidenceFilter;
};

const SOURCE_LABELS: Record<PublicMapSourceFilter, string> = {
  all: "Semua sumber yang diizinkan",
  demo: "Data ilustrasi sintetis",
  VIIRS_SNPP_NRT: "NASA VIIRS SNPP",
  VIIRS_NOAA20_NRT: "NASA VIIRS NOAA-20",
  VIIRS_NOAA21_NRT: "NASA VIIRS NOAA-21",
};

export function PublicMapFiltersPanel({
  filters,
  onChange,
  hasUnappliedViewport,
  onSearchViewport,
  isLoading,
}: {
  filters: PublicMapFilters;
  onChange: (filters: Partial<PublicMapFilters>) => void;
  hasUnappliedViewport: boolean;
  onSearchViewport: () => void;
  isLoading: boolean;
}) {
  return (
    <section aria-labelledby="map-filter-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          className="font-heading text-xl font-bold text-peat-forest"
          id="map-filter-title"
        >
          Filter peta
        </h2>
        {isLoading ? (
          <span
            className="text-xs font-medium text-peat-forest/65"
            role="status"
          >
            Memperbarui…
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        <label className="grid gap-1.5 text-sm font-semibold text-peat-forest">
          <span>
            Waktu pengamatan{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (opsional)
            </span>
          </span>
          <select
            className="min-h-11 w-full rounded-xl border border-peat-forest/20 bg-white px-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
            onChange={(event) =>
              onChange({ period: event.currentTarget.value as PublicMapPeriod })
            }
            value={filters.period}
          >
            <option value="24h">24 jam terakhir</option>
            <option value="7d">7 hari terakhir</option>
            <option value="30d">30 hari terakhir</option>
            <option value="all">Semua waktu tersimpan</option>
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-peat-forest">
          <span>
            Sumber hotspot{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (opsional)
            </span>
          </span>
          <select
            className="min-h-11 w-full rounded-xl border border-peat-forest/20 bg-white px-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
            onChange={(event) =>
              onChange({
                source: event.currentTarget.value as PublicMapSourceFilter,
              })
            }
            value={filters.source}
          >
            {Object.entries(SOURCE_LABELS).map(([source, label]) => (
              <option key={source} value={source}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-peat-forest">
          <span>
            Keyakinan satelit{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (opsional)
            </span>
          </span>
          <select
            className="min-h-11 w-full rounded-xl border border-peat-forest/20 bg-white px-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
            onChange={(event) =>
              onChange({
                confidence: event.currentTarget
                  .value as PublicMapConfidenceFilter,
              })
            }
            value={filters.confidence}
          >
            <option value="all">Semua tingkat</option>
            <option value="high">Tinggi</option>
            <option value="nominal">Menengah</option>
            <option value="low">Rendah</option>
            <option value="numeric">Nilai numerik (asli)</option>
            <option value="unknown">Tidak tersedia</option>
          </select>
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-peat-forest/10 bg-white px-3 py-3">
        <p className="text-xs leading-5 text-peat-forest/70">
          Area pencarian mengikuti batas peta. Geser atau perbesar peta, lalu
          tekan tombol untuk memuat area baru.
        </p>
        <button
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-peat-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-peat-green disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!hasUnappliedViewport || isLoading}
          onClick={onSearchViewport}
          type="button"
        >
          Cari di area peta
        </button>
      </div>
    </section>
  );
}
