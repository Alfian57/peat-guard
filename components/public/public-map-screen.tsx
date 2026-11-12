import Link from "next/link";
import { ArrowLeft, Leaf, RefreshCw } from "lucide-react";

import { MapCanvasLoader } from "@/components/maps/map-canvas-loader";
import {
  PublicMapFiltersPanel,
  type PublicMapFilters,
} from "@/components/public/public-map-filters";
import { PublicMapFreshness } from "@/components/public/public-map-freshness";
import { PublicMapResults } from "@/components/public/public-map-results";
import { PublicMapResultsSkeleton } from "@/components/public/public-map-results-skeleton";
import type { MapViewport } from "@/lib/maps/types";
import type { PublicMapViewData } from "@/lib/public/client-contracts";
import { APP_ROUTES } from "@/lib/routes";

export type PublicMapLoadState = "loading" | "ready" | "error";

const INITIAL_CENTER: [number, number] = [113.9, -2.01];

export function PublicMapScreen({
  filters,
  hasUnappliedViewport,
  loadState,
  errorMessage,
  data,
  onFilterChange,
  onSearchViewport,
  onRetry,
  onViewportChange,
}: {
  filters: PublicMapFilters;
  hasUnappliedViewport: boolean;
  loadState: PublicMapLoadState;
  errorMessage: string | null;
  data: PublicMapViewData | null;
  onFilterChange: (filters: Partial<PublicMapFilters>) => void;
  onSearchViewport: () => void;
  onRetry: () => void;
  onViewportChange: (viewport: MapViewport) => void;
}) {
  return (
    <main className="flex min-h-[100dvh] flex-col bg-peat-paper text-peat-forest">
      <header className="relative z-10 flex min-h-16 items-center justify-between gap-4 border-b border-peat-forest/10 bg-white px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            aria-label="Kembali ke beranda PEATGUARD"
            className="grid size-11 shrink-0 place-items-center rounded-full text-peat-forest hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
            href={APP_ROUTES.home}
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </Link>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-peat-forest text-peat-sun">
            <Leaf aria-hidden="true" size={19} />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-lg leading-none font-bold tracking-wide">
              PEATGUARD
            </p>
            <p className="mt-1 truncate text-xs text-peat-forest/65">
              Peta pantauan publik
            </p>
          </div>
        </div>
        <p className="hidden max-w-md text-right text-xs leading-5 text-peat-forest/65 sm:block">
          Hanya zona disetujui dan hotspot satelit yang ditampilkan.
        </p>
      </header>

      <div className="grid flex-1 grid-rows-[minmax(22rem,58svh)_auto] lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)] lg:grid-rows-1">
        <aside className="order-2 min-h-0 overflow-y-auto border-t border-peat-forest/10 bg-peat-paper p-4 sm:p-5 lg:order-1 lg:border-t-0 lg:border-r">
          <div className="mb-5">
            <p className="text-xs font-bold tracking-[.14em] text-peat-green uppercase">
              Informasi publik
            </p>
            <h1 className="mt-1 font-heading text-3xl leading-none font-bold">
              Pantauan gambut
            </h1>
            <p className="mt-2 text-sm leading-6 text-peat-forest/70">
              Jelajahi batas zona yang disetujui dan indikasi titik panas dari
              pengamatan satelit.
            </p>
          </div>

          <PublicMapFiltersPanel
            filters={filters}
            hasUnappliedViewport={hasUnappliedViewport}
            isLoading={loadState === "loading"}
            onChange={onFilterChange}
            onSearchViewport={onSearchViewport}
          />

          {loadState === "loading" ? <PublicMapResultsSkeleton /> : null}

          {loadState === "error" && errorMessage ? (
            <div
              className="mt-4 rounded-2xl border border-critical/20 bg-red-50 p-4"
              role="alert"
            >
              <p className="text-sm leading-6 text-red-950">{errorMessage}</p>
              <button
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-red-950/20 px-4 text-sm font-semibold text-red-950 hover:bg-white"
                onClick={onRetry}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={15} />
                Coba lagi
              </button>
            </div>
          ) : null}

          {data ? (
            <div className="mt-5 space-y-5">
              <PublicMapFreshness freshness={data.freshness} />
              <PublicMapResults data={data} />
            </div>
          ) : null}

          <p className="mt-5 border-t border-peat-forest/10 pt-4 text-xs leading-5 text-peat-forest/60">
            Peta ini tidak memuat pin laporan lapangan atau identitas relawan.
          </p>
        </aside>

        <section
          aria-label="Peta interaktif publik"
          className="relative order-1 min-h-[22rem] bg-[#e6ebdf] lg:order-2 lg:min-h-0"
        >
          <MapCanvasLoader
            autoFit={false}
            className="absolute inset-0 h-full min-h-[22rem] overflow-hidden"
            clusterPoints={false}
            initialCenter={INITIAL_CENTER}
            initialZoom={6.5}
            maxAutoFitZoom={6.5}
            onViewportChange={onViewportChange}
            points={data?.hotspots ?? []}
            zones={data?.zones ?? []}
          />
          <div className="pointer-events-none absolute top-3 left-3 z-[1] max-w-[min(26rem,calc(100%-1.5rem))] rounded-xl border border-white/75 bg-white/95 px-3 py-2 text-xs leading-5 text-peat-forest shadow-sm">
            Zona berwarna hijau telah disetujui. Titik hotspot adalah indikasi
            satelit, bukan konfirmasi api.
          </div>
          <ul
            aria-label="Legenda peta"
            className="absolute right-3 bottom-3 z-[1] flex flex-wrap gap-x-4 gap-y-2 rounded-xl border border-white/75 bg-white/95 px-3 py-2 text-xs font-medium text-peat-forest shadow-sm"
          >
            <li className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 rounded-sm border border-peat-green bg-peat-leaf"
              />
              Zona disetujui
            </li>
            <li className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 rounded-full bg-[#dc5a1b]"
              />
              Hotspot satelit
            </li>
            {data?.zones.some((zone) => zone.isDemoData) ? (
              <li className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-3 rounded-sm border border-peat-sun bg-peat-sun"
                />
                Zona ilustrasi sintetis
              </li>
            ) : null}
            {data?.hotspots.some((hotspot) => hotspot.isDemoData) ? (
              <li className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-3 rounded-full border-2 border-[#dc5a1b] bg-peat-sun"
                />
                Hotspot ilustrasi sintetis
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </main>
  );
}
