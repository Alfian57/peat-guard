"use client";

import Link from "next/link";
import { ArrowRight, MapPinned } from "lucide-react";
import { useEffect, useState } from "react";

import { MetricsGrid } from "@/components/public/metrics-grid";
import { PublicMapPanel } from "@/components/public/public-map-panel";
import type { PublicLoadState } from "@/components/public/public-types";
import { API_ROUTES, APP_ROUTES } from "@/lib/routes";
import {
  parsePublicMapData,
  parsePublicMetrics,
  type PublicMapViewData,
} from "@/lib/public/client-contracts";
import type { PublicMetrics } from "@/lib/public/contracts";

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store", signal });

  if (!response.ok) {
    throw new Error("Public data request failed.");
  }

  return response.json();
}

export function PublicMonitor() {
  const [retryKey, setRetryKey] = useState(0);
  const [mapData, setMapData] = useState<PublicMapViewData | null>(null);
  const [metrics, setMetrics] = useState<PublicMetrics | null>(null);
  const [mapState, setMapState] = useState<PublicLoadState>("loading");
  const [metricsState, setMetricsState] = useState<PublicLoadState>("loading");

  useEffect(() => {
    const controller = new AbortController();

    fetchJson(`${API_ROUTES.public.map}?period=30d`, controller.signal)
      .then((data) => {
        setMapData(parsePublicMapData(data));
        setMapState("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setMapState("error");
        }
      });

    fetchJson(API_ROUTES.public.metrics, controller.signal)
      .then(parsePublicMetrics)
      .then((data) => {
        setMetrics(data);
        setMetricsState("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setMetricsState("error");
        }
      });

    return () => controller.abort();
  }, [retryKey]);

  function retryLoadingData() {
    setMapData(null);
    setMetrics(null);
    setMapState("loading");
    setMetricsState("loading");
    setRetryKey((current) => current + 1);
  }

  return (
    <>
      <section
        aria-labelledby="pantauan-title"
        className="public-monitor__metrics-section bg-peat-paper py-20 sm:py-24"
        id="pantauan"
      >
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
          <div className="grid gap-8 border-b border-peat-forest/15 pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="public-scroll-reveal max-w-3xl">
              <p className="text-xs font-bold tracking-[.18em] text-peat-green uppercase">
                Data riil · rujukan resmi gambut & karhutla
              </p>
              <h2
                className="mt-4 font-heading text-4xl leading-[.98] font-bold text-balance text-peat-forest sm:text-6xl"
                id="pantauan-title"
              >
                Keadaan gambut, terlihat lebih jelas.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-peat-forest/75">
                Ringkasan faktual bentang Kesatuan Hidrologis Gambut (KHG),
                kawasan lindung, dan pantauan karhutla di wilayah Kalimantan.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-peat-forest/20 px-4 text-sm font-semibold text-peat-forest transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-peat-green lg:self-auto"
              href={APP_ROUTES.publicMap}
            >
              Jelajahi peta
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>

          <MetricsGrid
            metrics={metrics}
            onRetry={retryLoadingData}
            state={metricsState}
          />
        </div>
      </section>

      <section
        aria-labelledby="peta-publik-title"
        className="public-monitor__map-section bg-white py-20 sm:py-24"
        id="peta-publik"
      >
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="public-scroll-reveal max-w-3xl">
              <p className="text-xs font-bold tracking-[.18em] text-peat-green uppercase">
                Buka · baca · telusuri
              </p>
              <h2
                className="mt-4 font-heading text-4xl leading-[.98] font-bold text-balance text-peat-forest sm:text-6xl"
                id="peta-publik-title"
              >
                Satu peta untuk memahami konteks.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-peat-forest/75">
                Jelajahi zona yang telah disetujui dan indikasi hotspot dari
                NASA FIRMS. Titik panas adalah indikasi satelit, bukan
                konfirmasi kejadian kebakaran.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-peat-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-peat-green md:self-auto"
              href={APP_ROUTES.publicMap}
            >
              <MapPinned aria-hidden="true" size={17} />
              Lihat peta layar penuh
            </Link>
          </div>

          <div className="public-map__frame w-full rounded-[2rem] border border-peat-forest/10 bg-peat-paper p-5 shadow-sm sm:p-8 lg:p-10">
            <PublicMapPanel
              mapData={mapData}
              onRetry={retryLoadingData}
              state={mapState}
            />
          </div>
        </div>
      </section>
    </>
  );
}
