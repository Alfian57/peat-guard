import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
import { CalendarDays, ChartNoAxesCombined } from "lucide-react";

import type { MrvDashboard } from "@/lib/server/mrv/contracts";

import { AuditFilterError } from "../audit-states";
import { formatDate } from "../audit-formatters";
import { DashboardCarbonDetails } from "./dashboard-carbon-details";
import { DashboardDateFilter } from "./dashboard-date-filter";
import { DashboardKpis } from "./dashboard-kpis";
import { DashboardVillages } from "./dashboard-villages";

type DashboardViewProps = {
  dashboard: MrvDashboard;
  filterError: string | null;
  from: string;
  to: string;
};

export function DashboardView({
  dashboard,
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
        action={
          dashboard.totals.containsIllustrativeData ? (
            <span className="rounded-full bg-peat-sun/20 px-3 py-1 text-xs font-semibold text-peat-forest">
              Data demo termasuk
            </span>
          ) : undefined
        }
      />
      <section
        aria-label="Periode aktivitas"
        className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
      >
        <CalendarDays
          aria-hidden="true"
          className="text-peat-green"
          size={17}
        />
        <span>
          Aktivitas: {formatDate(dashboard.activityPeriod.from)} –{" "}
          {formatDate(dashboard.activityPeriod.to)}
        </span>
        <span aria-hidden="true">·</span>
        <span>Snapshot zona per {formatDate(dashboard.asOf.slice(0, 10))}</span>
      </section>

      {filterError ? <AuditFilterError message={filterError} /> : null}
      <DashboardDateFilter from={from} to={to} />

      <DashboardKpis dashboard={dashboard} />

      <DashboardVillages dashboard={dashboard} />
      <DashboardCarbonDetails dashboard={dashboard} />
      <section
        aria-labelledby="dashboard-trend-title"
        className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-peat-forest/10 bg-white p-6 text-center shadow-xs"
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-peat-paper text-peat-green">
          <ChartNoAxesCombined aria-hidden="true" size={23} />
        </span>
        <h2
          id="dashboard-trend-title"
          className="mt-4 font-heading text-xl font-bold text-peat-forest"
        >
          Tren estimasi emisi dicegah
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Perubahan bulanan belum dapat dihitung.
        </p>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Riwayat versi zona belum tersedia; angka di atas merupakan snapshot
          saat ini.
        </p>
      </section>

      <p className="px-1 text-xs leading-5 text-muted-foreground">
        Aktivitas patroli tidak dijumlahkan berulang sebagai emisi yang dicegah.
        Estimasi emisi dicegah hanya mengikuti luas dan parameter zona yang
        disetujui.
      </p>
    </div>
  );
}
