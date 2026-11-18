import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
import { CalendarDays } from "lucide-react";

import type { MrvDashboard } from "@/lib/server/mrv/contracts";

import { AuditFilterError } from "../audit-states";
import { formatDate } from "../audit-formatters";
import { DashboardCarbonDetails } from "./dashboard-carbon-details";
import { DashboardDateFilter } from "./dashboard-date-filter";
import { DashboardCarbonTrend } from "./dashboard-carbon-trend";
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
