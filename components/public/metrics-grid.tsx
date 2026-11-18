"use client";

import { Flame, Leaf, MapPinned, Sprout } from "lucide-react";
import { motion } from "motion/react";

import { MetricCard } from "@/components/public/metric-card";
import type { PublicLoadState } from "@/components/public/public-types";
import type { PublicMetrics } from "@/lib/public/contracts";
import { Skeleton } from "@/components/ui/skeleton";

const firmsStatusLabel = {
  fresh: "",
  partial: " · Sinkronisasi parsial",
  stale: " · Data belum mutakhir",
  unavailable: " · Sinkronisasi belum tersedia",
  not_configured: " · Sinkronisasi belum dikonfigurasi",
  configuration_error: " · Konfigurasi sinkronisasi bermasalah",
} satisfies Record<NonNullable<PublicMetrics["firmsFreshness"]>, string>;

export function MetricsGrid({
  state,
  metrics,
  onRetry,
}: {
  metrics?: PublicMetrics | null;
  state?: PublicLoadState;
  onRetry?: () => void;
}) {
  const demo =
    (metrics?.illustrativeZoneCount ?? 0) > 0
      ? " · Termasuk data ilustratif"
      : "";
  const metricsCards = metrics
    ? [
        {
          label: "Zona disetujui",
          value: metrics.approvedZoneCount,
          unit: "zona",
          decimals: 0,
          detail: `Zona dalam PEATGUARD${demo}`,
          icon: <MapPinned aria-hidden="true" size={20} />,
        },
        {
          label: "Luas zona terhitung",
          value: metrics.protectedAreaHectares,
          unit: "ha",
          decimals: 2,
          detail: `${metrics.excludedZoneCount ? `${metrics.excludedZoneCount} zona konflik dikecualikan` : "Total area zona disetujui"}${demo}`,
          icon: <Sprout aria-hidden="true" size={20} />,
        },
        {
          label: "Estimasi emisi dicegah",
          value: metrics.estimatedCarbonTons,
          unit: "t CO₂e",
          decimals: 2,
          detail: `Estimasi simulasi PEATGUARD${demo}`,
          icon: <Leaf aria-hidden="true" size={20} />,
        },
        {
          label: "Hotspot NASA FIRMS",
          value:
            metrics.firmsFreshness === "fresh" ||
            (metrics.firmsHotspotCount ?? 0) > 0
              ? (metrics.firmsHotspotCount ?? null)
              : null,
          unit: "titik",
          decimals: 0,
          detail: `Deteksi tersimpan · ${metrics.hotspotPeriodDays ?? 7} hari terakhir${firmsStatusLabel[metrics.firmsFreshness ?? "unavailable"]}`,
          icon: <Flame aria-hidden="true" size={20} />,
        },
      ]
    : [];
  if (state !== "loading" && (!metrics || state === "error")) {
    return (
      <div className="public-metrics__grid">
        <div role="status" className="space-y-2">
          <p>Metrik pantauan belum dapat dimuat.</p>
          <button
            className="rounded-lg border px-3 py-2 text-sm"
            type="button"
            onClick={onRetry}
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }
  return (
    <motion.div
      aria-busy={state === "loading"}
      className="public-metrics__grid"
      variants={{
        rest: {},
        visible: { transition: { staggerChildren: 0.12 } },
      }}
    >
      {state === "loading"
        ? Array.from({ length: 4 }, (_, index) => (
            <div
              aria-hidden="true"
              className="public-metric-card public-metric-card--loading"
              key={index}
            >
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-28 rounded-md bg-peat-forest/10" />
                <Skeleton className="size-8 rounded-xl bg-peat-forest/10" />
              </div>
              <Skeleton className="mt-5 h-8 w-24 rounded-lg bg-peat-forest/15" />
              <Skeleton className="mt-3 h-3 w-40 rounded-md bg-peat-forest/10" />
            </div>
          ))
        : metricsCards.map((metric) => (
            <MetricCard
              detail={metric.detail}
              icon={metric.icon}
              key={metric.label}
              label={metric.label}
              value={metric.value}
              unit={metric.unit}
              decimals={metric.decimals}
              suffix=""
            />
          ))}
    </motion.div>
  );
}
