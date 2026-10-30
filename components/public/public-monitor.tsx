"use client";

import { useEffect, useState } from "react";
import { MapPinned } from "lucide-react";

import { CarbonImpactCard } from "@/components/public/carbon-impact-card";
import { MetricsGrid } from "@/components/public/metrics-grid";
import { PublicMapPanel } from "@/components/public/public-map-panel";
import type { PublicLoadState } from "@/components/public/public-types";
import type { PublicMapData, PublicMetrics } from "@/lib/public/contracts";

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal });

  if (!response.ok) {
    throw new Error("Public data request failed.");
  }

  return (await response.json()) as T;
}

export function PublicMonitor() {
  const [retryKey, setRetryKey] = useState(0);
  const [mapData, setMapData] = useState<PublicMapData | null>(null);
  const [metrics, setMetrics] = useState<PublicMetrics | null>(null);
  const [mapState, setMapState] = useState<PublicLoadState>("loading");
  const [metricsState, setMetricsState] = useState<PublicLoadState>("loading");

  useEffect(() => {
    const controller = new AbortController();

    fetchJson<PublicMapData>("/api/public/map", controller.signal)
      .then((data) => {
        setMapData(data);
        setMapState("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setMapState("error");
        }
      });

    fetchJson<PublicMetrics>("/api/public/metrics", controller.signal)
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
    <section
      aria-labelledby="pantauan-title"
      className="bg-peat-paper py-16 sm:py-20"
      id="dampak"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-bold tracking-[.16em] text-peat-green uppercase">
              Kondisi yang dapat dipantau
            </p>
            <h2
              className="mt-3 font-heading text-4xl leading-none font-bold text-peat-forest sm:text-5xl"
              id="pantauan-title"
            >
              Data terbuka, perlindungan terukur.
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-peat-forest/75">
              Ringkasan ini hanya menggunakan zona yang sudah disetujui dan
              catatan hotspot satelit. Titik laporan warga tidak ditampilkan di
              peta publik.
            </p>
          </div>
          <a
            className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border border-peat-forest/20 px-4 text-sm font-semibold text-peat-forest transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-peat-green sm:self-auto"
            href="#peta-publik"
          >
            <MapPinned aria-hidden="true" size={17} />
            Buka peta publik
          </a>
        </div>

        <MetricsGrid
          metrics={metrics}
          onRetry={retryLoadingData}
          state={metricsState}
        />

        {metrics?.containsIllustrativeData ? (
          <p className="mt-4 rounded-xl border border-peat-sun/50 bg-peat-sun/15 px-4 py-3 text-sm leading-6 text-peat-forest">
            Sebagian angka atau titik pada ringkasan ini memakai data ilustrasi
            sintetis untuk demonstrasi. Data tersebut bukan hasil pemantauan
            operasional.
          </p>
        ) : null}

        <div
          className="mt-12 grid gap-8 lg:grid-cols-[1.55fr_.75fr]"
          id="peta-publik"
        >
          <PublicMapPanel
            mapData={mapData}
            onRetry={retryLoadingData}
            state={mapState}
          />
          <CarbonImpactCard />
        </div>
      </div>
    </section>
  );
}
