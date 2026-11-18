"use client";

import Link from "next/link";
import { ArrowRight, MapPinned } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

import { PublicSection } from "@/components/public/public-section";
import { sectionReveal } from "@/components/public/public-section-motion";

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
      <PublicSection
        id="pantauan"
        labelledBy="pantauan-title"
        className="public-monitor__metrics-section"
      >
        <div className="public-section__inner public-metrics__layout">
          <motion.div
            className="public-section__reveal public-section__eyebrow"
            variants={sectionReveal}
          >
            <span>03 / Membaca bentang</span>
            <span>Kalimantan, Indonesia</span>
          </motion.div>

          <div className="public-metrics__main">
            <motion.div
              className="public-section__reveal public-metrics__intro"
              variants={sectionReveal}
            >
              <p className="public-section__kicker">
                Metrik PEATGUARD dan NASA FIRMS
              </p>
              <h2
                className="public-section__title public-metrics__title"
                id="pantauan-title"
              >
                <span className="public-metrics__title-lead">
                  Keadaan gambut,
                </span>
                <span>terlihat lebih jelas.</span>
              </h2>
              <p className="public-section__description">
                Ringkasan zona dalam PEATGUARD dan pantauan titik panas satelit
                di wilayah Kalimantan.
              </p>
              <Link
                className="public-section__text-link"
                href={APP_ROUTES.publicMap}
              >
                Jelajahi peta <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </motion.div>
            <MetricsGrid
              metrics={metrics}
              onRetry={retryLoadingData}
              state={metricsState}
            />
          </div>

          <motion.div
            className="public-section__reveal public-metrics__footnote"
            variants={sectionReveal}
          >
            <span>Memahami skala. Menentukan perhatian.</span>
            <span>Sumber data PEATGUARD dan NASA FIRMS</span>
          </motion.div>
        </div>
      </PublicSection>

      <PublicSection
        id="peta-publik"
        labelledBy="peta-publik-title"
        className="public-monitor__map-section"
      >
        <div className="public-section__inner public-map__layout">
          <motion.div
            className="public-section__reveal public-section__eyebrow"
            variants={sectionReveal}
          >
            <span>04 / Menjelajahi konteks</span>
            <span>Terbuka untuk publik</span>
          </motion.div>

          <motion.div
            className="public-section__reveal public-map__heading"
            variants={sectionReveal}
          >
            <div>
              <h2 className="public-section__title" id="peta-publik-title">
                Satu peta untuk memahami konteks.
              </h2>
              <p className="public-section__description">
                Zona yang telah disetujui dan indikasi hotspot NASA FIRMS.
                Hotspot bukan konfirmasi kejadian kebakaran.
              </p>
            </div>
            <Link
              className="public-section__button"
              href={APP_ROUTES.publicMap}
            >
              <MapPinned aria-hidden="true" size={17} />
              Lihat peta layar penuh
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </motion.div>

          <motion.div
            className="public-section__reveal public-map__frame"
            variants={sectionReveal}
          >
            <PublicMapPanel
              mapData={mapData}
              onRetry={retryLoadingData}
              state={mapState}
            />
          </motion.div>
        </div>
      </PublicSection>
    </>
  );
}
