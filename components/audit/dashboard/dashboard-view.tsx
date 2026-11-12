import { CalendarDays, Info } from "lucide-react";

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
      <header className="rounded-3xl bg-[#eaf1e2] px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl leading-tight font-bold text-peat-forest sm:text-5xl">
              Jejak patroli, dampak yang terukur.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Transparansi estimasi pencegahan emisi gambut dan aktivitas
              masyarakat.
            </p>
          </div>
          {dashboard.totals.containsIllustrativeData ? (
            <span className="inline-flex h-8 min-h-8 items-center gap-1.5 rounded-full border border-border bg-white px-3 text-xs font-semibold text-peat-forest shadow-xs">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-peat-sun"
              />
              Data demo termasuk
            </span>
          ) : null}
        </div>
      </header>

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
      <DashboardCarbonDetails dashboard={dashboard} />

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <section
          aria-labelledby="dashboard-trend-title"
          className="audit-print-card rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-peat-paper text-peat-green">
              <Info aria-hidden="true" size={20} />
            </span>
            <div>
              <h2
                className="font-heading text-2xl font-bold text-peat-forest"
                id="dashboard-trend-title"
              >
                Tren estimasi karbon
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Perubahan bulanan belum dapat dihitung.
              </p>
            </div>
          </div>
          <p className="mt-6 rounded-xl border border-dashed border-border bg-peat-paper/50 p-4 text-sm leading-6 text-muted-foreground">
            Riwayat persetujuan zona dan versi parameter belum disimpan dari
            waktu ke waktu. Kartu di atas menampilkan snapshot saat ini.
          </p>
        </section>
        <DashboardVillages dashboard={dashboard} />
      </div>

      <p className="px-1 text-xs leading-5 text-muted-foreground">
        Aktivitas patroli tidak dijumlahkan berulang sebagai emisi yang dicegah.
        Estimasi karbon hanya mengikuti luas dan parameter zona yang disetujui.
      </p>
    </div>
  );
}
