import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";

import { MapCanvasLoader } from "@/components/maps/map-canvas-loader";
import {
  PublicMapFiltersPanel,
  type PublicMapFilters,
} from "@/components/public/public-map-filters";
import { PublicMapResults } from "@/components/public/public-map-results";
import { PublicMapResultsSkeleton } from "@/components/public/public-map-results-skeleton";
import type { MapViewport } from "@/lib/maps/types";
import type { PublicMapViewData } from "@/lib/public/client-contracts";
import { APP_ROUTES } from "@/lib/routes";

export type PublicMapLoadState = "loading" | "ready" | "error";

const INITIAL_CENTER: [number, number] = [113.9, -2.01];

const satelliteNotices = {
  fresh: null,
  partial: "Pembaruan hotspot parsial",
  stale: "Data hotspot belum mutakhir",
  unavailable: "Data hotspot belum tersedia",
  not_configured: "Pembaruan hotspot belum tersedia",
  configuration_error: "Pembaruan hotspot terkendala",
} satisfies Record<PublicMapViewData["freshness"]["status"], string | null>;

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
  const [menuOpen, setMenuOpen] = useState(false);
  const satelliteNotice = data && satelliteNotices[data.freshness.status];

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-peat-paper text-peat-forest">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-peat-forest/10 bg-white px-3 pt-[env(safe-area-inset-top)] sm:px-6">
        <div className="flex min-h-16 min-w-0 items-center gap-2 sm:gap-3">
          <Link
            aria-label="Kembali ke beranda PEATGUARD"
            className="grid size-11 shrink-0 place-items-center rounded-full text-peat-forest hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
            href={APP_ROUTES.home}
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </Link>
          <BrandLogo height={32} variant="circle" />
          <h1 className="min-w-0 truncate font-heading text-xl leading-none font-bold">
            Pantauan gambut
          </h1>
        </div>
        <p className="hidden max-w-md text-right text-xs leading-5 text-peat-forest/65 lg:block">
          Hanya zona disetujui dan hotspot satelit yang ditampilkan.
        </p>
        <button
          aria-controls="public-map-menu"
          aria-expanded={menuOpen}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-peat-forest/15 px-2.5 text-sm font-semibold aria-expanded:bg-peat-paper lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" size={16} />
          Menu peta
        </button>
      </header>

      <div className="relative isolate grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] overflow-hidden lg:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
        <aside
          aria-label="Filter dan hasil peta"
          className={`${menuOpen ? "block" : "hidden"} absolute inset-x-0 bottom-0 z-10 max-h-[75%] min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-2xl border-t border-peat-forest/10 bg-peat-paper px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-peat-green sm:px-5 lg:relative lg:inset-auto lg:col-start-1 lg:row-start-1 lg:block lg:max-h-none lg:rounded-none lg:border-t-0 lg:border-r lg:shadow-none`}
          id="public-map-menu"
          tabIndex={0}
        >
          <PublicMapFiltersPanel
            filters={filters}
            hasUnappliedViewport={hasUnappliedViewport}
            isLoading={loadState === "loading"}
            loadingLabel={
              data ? "Memperbarui…" : "Memuat data untuk filter terpilih…"
            }
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
            <div className="mt-5">
              <PublicMapResults data={data} />
            </div>
          ) : null}

          <p className="mt-5 border-t border-peat-forest/10 pt-4 text-xs leading-5 text-peat-forest/60">
            Peta ini tidak memuat pin laporan lapangan atau identitas relawan.
          </p>
        </aside>

        <section
          aria-label="Peta interaktif publik"
          className="col-start-1 row-start-1 flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#e6ebdf] lg:col-start-2"
        >
          <div className="relative min-h-0 flex-1 overflow-hidden [&>[data-map-placeholder]]:min-h-0 [&>[data-map-placeholder]]:rounded-none">
            <MapCanvasLoader
              autoFit={false}
              className="h-full overflow-hidden"
              clusterPoints={false}
              cooperativeGestures={false}
              initialCenter={INITIAL_CENTER}
              initialZoom={6.5}
              maxAutoFitZoom={6.5}
              onViewportChange={onViewportChange}
              points={data?.hotspots ?? []}
              zones={data?.zones ?? []}
            />
            <div className="pointer-events-none absolute top-3 left-3 z-[1] max-w-[min(26rem,calc(100%-4.25rem))] rounded-xl border border-white/75 bg-white/95 px-3 py-2 text-xs leading-5 text-peat-forest shadow-sm">
              Titik hotspot adalah indikasi satelit. Konfirmasi kejadian api
              memerlukan pemeriksaan lapangan.
            </div>
          </div>
          <ul
            aria-label="Legenda peta"
            className="flex shrink-0 flex-wrap gap-x-4 gap-y-2 border-t border-peat-forest/10 bg-white px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-xs font-medium text-peat-forest"
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
            {satelliteNotice ? (
              <li className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-amber-950">
                <TriangleAlert aria-hidden="true" size={13} />
                <span role="status">{satelliteNotice}</span>
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </main>
  );
}
