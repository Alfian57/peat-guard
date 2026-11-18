import { Activity, Coins, Leaf, MapPinned } from "lucide-react";

import type { MrvDashboard } from "@/lib/server/mrv/contracts";

import {
  formatCarbon,
  formatCount,
  formatCurrency,
  formatHectares,
} from "../audit-formatters";
import { KpiCard } from "./kpi-card";

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
          description={`${formatCount(dashboard.totals.approvedZoneCount)} zona disetujui · estimasi simulasi`}
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
