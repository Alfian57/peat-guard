"use client";

import { Flame, Leaf, MapPinned, Sprout } from "lucide-react";
import { motion } from "motion/react";

import { MetricCard } from "@/components/public/metric-card";
import type { PublicLoadState } from "@/components/public/public-types";
import type { PublicMetrics } from "@/lib/public/contracts";
import { Skeleton } from "@/components/ui/skeleton";

const KALIMANTAN_METRICS = [
  {
    detail: "Bentang hidrologis gambut Kalimantan (BRGM & KLHK)",
    icon: <MapPinned aria-hidden="true" size={20} />,
    label: "Kesatuan Hidrologis",
    value: 190,
    unit: "KHG",
    decimals: 0,
    suffix: "",
  },
  {
    detail: "Fungsi lindung ekosistem gambut prioritas Kalimantan",
    icon: <Sprout aria-hidden="true" size={20} />,
    label: "Kawasan lindung gambut",
    value: 4.09,
    unit: "Juta ha",
    decimals: 2,
    suffix: "",
  },
  {
    detail: "Luas karhutla terpantau di lahan gambut & mineral (SiPongi)",
    icon: <Flame aria-hidden="true" size={20} />,
    label: "Areal rawan karhutla",
    value: 38310,
    unit: "ha",
    decimals: 0,
    suffix: "",
  },
  {
    detail: "Simpanan karbon per hektare gambut tropis terlindungi",
    icon: <Leaf aria-hidden="true" size={20} />,
    label: "Cadangan karbon",
    value: 3000,
    unit: "t/ha",
    decimals: 0,
    suffix: "+",
  },
];

export function MetricsGrid({
  state,
}: {
  metrics?: PublicMetrics | null;
  state?: PublicLoadState;
  onRetry?: () => void;
}) {
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
        : KALIMANTAN_METRICS.map((metric) => (
            <MetricCard
              detail={metric.detail}
              icon={metric.icon}
              key={metric.label}
              label={metric.label}
              value={metric.value}
              unit={metric.unit}
              decimals={metric.decimals}
              suffix={metric.suffix}
            />
          ))}
    </motion.div>
  );
}
