import { Flame, Leaf, MapPinned, Sprout } from "lucide-react";

import { MetricCard } from "@/components/public/metric-card";
import type { PublicLoadState } from "@/components/public/public-types";
import type { PublicMetrics } from "@/lib/public/contracts";
import { Skeleton } from "@/components/ui/skeleton";

const KALIMANTAN_METRICS = [
  {
    detail: "Bentang hidrologis gambut Kalimantan (BRGM & KLHK)",
    icon: <MapPinned aria-hidden="true" size={20} />,
    label: "Kesatuan Hidrologis",
    value: "190 KHG",
  },
  {
    detail: "Fungsi lindung ekosistem gambut prioritas Kalimantan",
    icon: <Sprout aria-hidden="true" size={20} />,
    label: "Kawasan lindung gambut",
    value: "4,09 Juta ha",
  },
  {
    detail: "Luas karhutla terpantau di lahan gambut & mineral (SiPongi)",
    icon: <Flame aria-hidden="true" size={20} />,
    label: "Areal rawan karhutla",
    value: "38.310 ha",
  },
  {
    detail: "Simpanan karbon per hektare gambut tropis terlindungi",
    icon: <Leaf aria-hidden="true" size={20} />,
    label: "Cadangan karbon",
    value: "3.000+ t/ha",
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
    <div
      aria-busy={state === "loading"}
      className="public-metrics__grid mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {state === "loading"
        ? Array.from({ length: 4 }, (_, index) => (
            <div
              aria-hidden="true"
              className="min-h-36 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs"
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
            />
          ))}
    </div>
  );
}
