import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
import Link from "next/link";

import { APP_ROUTES } from "@/lib/routes";

import type { MrvDashboard, MrvDataset } from "@/lib/server/mrv/contracts";

import { AuditFilterError } from "../audit-states";
import { DashboardCarbonDetails } from "./dashboard-carbon-details";
import { DashboardDateFilter } from "./dashboard-date-filter";
import { DashboardCarbonTrend } from "./dashboard-carbon-trend";
import { DashboardKpis } from "./dashboard-kpis";
import { DashboardVillages } from "./dashboard-villages";

type DashboardViewProps = {
  dashboard: MrvDashboard;
  dataset?: MrvDataset;
  filterError: string | null;
  from: string;
  to: string;
};

export function DashboardView({
  dashboard,
  dataset = "operational",
  filterError,
  from,
  to,
}: DashboardViewProps) {
  return (
    <div className="flex flex-col gap-5" id="audit-content">
      <WorkspacePageHeading
        className="mb-0"
        title="Dasbor dampak"
        description="Tinjau estimasi emisi dicegah, zona terlindungi, dan aktivitas patroli."
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <nav
          aria-label="Jenis data MRV"
          className="inline-flex gap-1 rounded-full border border-peat-forest/10 bg-white p-1 shadow-xs"
        >
          {(["operational", "simulation"] as const).map((option) => {
            const active = dataset === option;
            const params = new URLSearchParams({ dataset: option });
            if (from) params.set("from", from);
            if (to) params.set("to", to);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-full px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${active ? "bg-peat-forest text-white" : "text-peat-forest hover:bg-peat-paper"}`}
                href={`${APP_ROUTES.audit.dashboard}?${params}`}
                key={option}
              >
                {option === "operational" ? "Operasional" : "Simulasi"}
              </Link>
            );
          })}
        </nav>
        <p className="text-xs leading-5 text-muted-foreground">
          {dataset === "operational"
            ? "Zona, parameter, dan laporan non-demo."
            : "Zona atau parameter ilustratif dan laporan sampel demo."}
        </p>
      </div>
      {filterError ? <AuditFilterError message={filterError} /> : null}
      <DashboardDateFilter dataset={dataset} from={from} to={to} />

      <DashboardKpis dashboard={dashboard} />
      {!dashboard.totals.approvedZoneCount && !dashboard.villages.length ? (
        <p className="rounded-xl border border-peat-forest/10 bg-white px-4 py-3 text-sm text-muted-foreground">
          {dataset === "operational"
            ? "Belum ada zona atau laporan operasional untuk ditampilkan."
            : "Belum ada zona ilustratif atau laporan demo untuk ditampilkan."}
        </p>
      ) : null}

      <DashboardVillages dashboard={dashboard} />
      <DashboardCarbonDetails dashboard={dashboard} />
      <DashboardCarbonTrend trend={dashboard.carbonTrend} />
      {!!dashboard.totals.excludedZoneCount && (
        <p role="status" className="rounded-lg bg-peat-paper p-3 text-sm">
          {dashboard.totals.excludedZoneCount} zona disetujui dikeluarkan dari
          total dampak karena batasnya tumpang tindih.
        </p>
      )}

      <p className="px-1 text-xs leading-5 text-muted-foreground">
        Aktivitas patroli tidak dijumlahkan berulang sebagai emisi yang dicegah.
        Estimasi emisi dicegah hanya mengikuti luas dan parameter zona yang
        disetujui.
      </p>
    </div>
  );
}
