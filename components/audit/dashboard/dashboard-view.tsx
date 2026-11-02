import Link from "next/link";
import { CalendarDays, Info } from "lucide-react";

import type { MrvDashboard } from "@/lib/server/mrv/contracts";

import { AuditFilterError } from "../audit-states";
import { formatDate } from "../audit-formatters";
import { DashboardCarbonDetails } from "./dashboard-carbon-details";
import { DashboardKpis } from "./dashboard-kpis";
import { DashboardVillages } from "./dashboard-villages";

type DashboardViewProps = {
  dashboard: MrvDashboard;
  filterError: string | null;
  from: string;
  to: string;
};

function DashboardDateFilter({ from, to }: { from: string; to: string }) {
  return (
    <form
      action="/audit/dashboard"
      className="audit-hide-on-print flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm"
      method="get"
    >
      <div className="min-w-40 flex-1 space-y-2">
        <label
          className="block text-xs font-semibold text-peat-forest"
          htmlFor="dashboard-from"
        >
          Dari tanggal
        </label>
        <input
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          id="dashboard-from"
          max={to || undefined}
          name="from"
          required={Boolean(to)}
          type="date"
          defaultValue={from}
        />
      </div>
      <div className="min-w-40 flex-1 space-y-2">
        <label
          className="block text-xs font-semibold text-peat-forest"
          htmlFor="dashboard-to"
        >
          Sampai tanggal
        </label>
        <input
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          id="dashboard-to"
          min={from || undefined}
          name="to"
          required={Boolean(from)}
          type="date"
          defaultValue={to}
        />
      </div>
      <button
        className="min-h-11 rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white transition hover:bg-peat-green"
        type="submit"
      >
        <span className="inline-flex items-center gap-2">
          <CalendarDays aria-hidden="true" size={16} />
          Terapkan tanggal
        </span>
      </button>
      {from || to ? (
        <Link
          className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-peat-green underline-offset-4 hover:underline"
          href="/audit/dashboard"
        >
          Hapus filter
        </Link>
      ) : null}
    </form>
  );
}

export function DashboardView({
  dashboard,
  filterError,
  from,
  to,
}: DashboardViewProps) {
  return (
    <main
      className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      id="audit-content"
    >
      <header className="rounded-3xl bg-[#eaf1e2] px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-peat-green uppercase">
              Audit karbon · ringkasan
            </p>
            <h1 className="mt-1 font-heading text-4xl leading-tight font-bold text-peat-forest sm:text-5xl">
              Jejak patroli, dampak yang terukur.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Transparansi estimasi pencegahan emisi gambut dan aktivitas
              masyarakat.
            </p>
          </div>
          {dashboard.totals.containsIllustrativeData ? (
            <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-peat-forest shadow-sm">
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
    </main>
  );
}
