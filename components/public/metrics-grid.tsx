import {
  Activity,
  Flame,
  Leaf,
  MapPinned,
  RefreshCw,
  Sprout,
} from "lucide-react";
import type { ReactNode } from "react";

import type { PublicLoadState } from "@/components/public/public-types";
import type { PublicMetrics } from "@/lib/public/contracts";

function formatNumber(value: number, maximumFractionDigits = 0) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("id-ID", { maximumFractionDigits }).format(
    value,
  );
}

function formatRupiah(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-peat-forest/75">{label}</p>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-peat-forest/8 text-peat-green">
          {icon}
        </span>
      </div>
      <p className="mt-4 font-heading text-4xl leading-none font-bold text-peat-forest sm:text-[2.75rem]">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-peat-forest/65">{detail}</p>
    </article>
  );
}

export function MetricsGrid({
  metrics,
  state,
  onRetry,
}: {
  metrics: PublicMetrics | null;
  state: PublicLoadState;
  onRetry: () => void;
}) {
  return (
    <div
      aria-busy={state === "loading"}
      className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      {state === "ready" && metrics ? (
        <>
          <MetricCard
            detail="Zona yang telah disetujui untuk ditampilkan"
            icon={<MapPinned aria-hidden="true" size={20} />}
            label="Zona gambut"
            value={formatNumber(metrics.approvedZoneCount)}
          />
          <MetricCard
            detail="Luas gabungan zona yang disetujui"
            icon={<Sprout aria-hidden="true" size={20} />}
            label="Area terlindungi"
            value={formatNumber(metrics.protectedAreaHectares, 1)}
          />
          <MetricCard
            detail="Jumlah catatan hotspot yang tersimpan"
            icon={<Flame aria-hidden="true" size={20} />}
            label="Hotspot satelit"
            value={formatNumber(metrics.hotspotCount)}
          />
          <MetricCard
            detail="Estimasi indikatif, bukan nilai tersertifikasi"
            icon={<Leaf aria-hidden="true" size={20} />}
            label="Serapan karbon"
            value={`${formatNumber(metrics.estimatedCarbonTons, 1)} t`}
          />
          <MetricCard
            detail="Perkiraan berdasarkan parameter karbon aktif"
            icon={<Activity aria-hidden="true" size={20} />}
            label="Potensi insentif"
            value={formatRupiah(metrics.estimatedIncentiveIdr)}
          />
        </>
      ) : state === "error" ? (
        <div className="col-span-full flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-900/15 bg-red-50 p-5 sm:flex-row sm:items-center">
          <p className="text-sm leading-6 text-red-950" role="alert">
            Ringkasan dampak belum dapat dimuat. Silakan coba lagi.
          </p>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-red-900/20 px-4 text-sm font-semibold text-red-950 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-3"
            onClick={onRetry}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={16} />
            Coba lagi
          </button>
        </div>
      ) : (
        Array.from({ length: 5 }, (_, index) => (
          <div
            aria-hidden="true"
            className="min-h-36 animate-pulse rounded-2xl border border-peat-forest/10 bg-white p-5"
            key={index}
          >
            <div className="h-4 w-28 rounded bg-peat-forest/10" />
            <div className="mt-7 h-9 w-24 rounded bg-peat-forest/10" />
            <div className="mt-3 h-3 w-36 rounded bg-peat-forest/10" />
          </div>
        ))
      )}
    </div>
  );
}
