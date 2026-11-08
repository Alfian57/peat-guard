import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { APP_ROUTES } from "@/lib/routes";

export function DashboardDateFilter({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  return (
    <form
      action={APP_ROUTES.audit.dashboard}
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
          href={APP_ROUTES.audit.dashboard}
        >
          Hapus filter
        </Link>
      ) : null}
    </form>
  );
}
