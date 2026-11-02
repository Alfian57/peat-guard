import { Activity, Coins, Leaf, MapPinned } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { MrvDashboard } from "@/lib/server/mrv/contracts";

import {
  formatCarbon,
  formatCount,
  formatCurrency,
  formatHectares,
} from "../audit-formatters";

function KpiCard({
  label,
  value,
  description,
  icon: Icon,
  featured = false,
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  featured?: boolean;
}) {
  return (
    <article
      className={`audit-print-card rounded-2xl border p-5 shadow-sm sm:p-6 ${featured ? "border-peat-forest bg-peat-forest text-white" : "border-border bg-white text-peat-forest"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p
          className={`text-sm font-semibold ${featured ? "text-white/80" : "text-muted-foreground"}`}
        >
          {label}
        </p>
        <Icon
          aria-hidden="true"
          className={featured ? "text-white/75" : "text-peat-green"}
          size={19}
        />
      </div>
      <p className="mt-5 font-heading text-4xl leading-none font-bold tracking-wide sm:text-5xl">
        {value}
      </p>
      <p
        className={`mt-3 text-sm ${featured ? "text-white/75" : "text-muted-foreground"}`}
      >
        {description}
      </p>
    </article>
  );
}

export function DashboardKpis({ dashboard }: { dashboard: MrvDashboard }) {
  const reportCount = dashboard.villages.reduce(
    (total, village) =>
      total + village.fieldReportCount + village.demoFieldReportCount,
    0,
  );
  const triagedCount = dashboard.villages.reduce(
    (total, village) =>
      total +
      village.aiTriagedFieldReportCount +
      village.demoAiTriagedFieldReportCount,
    0,
  );

  return (
    <section aria-label="Ringkasan dampak dan aktivitas">
      <h2 className="sr-only">Ringkasan</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          description={`${formatCount(dashboard.totals.approvedZoneCount)} zona disetujui · estimasi, bukan kredit tersertifikasi`}
          featured
          icon={Leaf}
          label="Estimasi emisi dicegah"
          value={formatCarbon(dashboard.totals.estimatedCarbonTons)}
        />
        <KpiCard
          description="Luas gabungan zona gambut yang disetujui"
          icon={MapPinned}
          label="Area zona terlindungi"
          value={formatHectares(dashboard.totals.protectedAreaHectares)}
        />
        <KpiCard
          description={`${formatCount(triagedCount)} ditriase AI · tidak berarti lokasi terverifikasi`}
          icon={Activity}
          label="Laporan lapangan"
          value={formatCount(reportCount)}
        />
        <KpiCard
          description="Nilai ilustratif mengikuti parameter pada tiap zona"
          icon={Coins}
          label="Estimasi insentif"
          value={formatCurrency(dashboard.totals.estimatedIncentiveIdr)}
        />
      </div>
    </section>
  );
}
