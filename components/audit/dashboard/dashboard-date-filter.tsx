"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Filter, X } from "lucide-react";
import { APP_ROUTES } from "@/lib/routes";
import { DashboardDateFilterDialog } from "@/components/audit/dashboard/dashboard-date-filter-dialog";

export function DashboardDateFilter({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);

  const hasActiveFilter = Boolean(from || to);

  function handleOpen() {
    setDraftFrom(from);
    setDraftTo(to);
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <div className="audit-hide-on-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3.5 shadow-sm sm:px-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          aria-controls="dashboard-date-filter-dialog"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-peat-green transition hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={handleOpen}
          type="button"
        >
          <Filter aria-hidden="true" size={17} />
          <span>
            {hasActiveFilter ? "Ubah filter tanggal" : "Filter periode tanggal"}
          </span>
          {hasActiveFilter ? (
            <span className="grid size-5 place-items-center rounded-full bg-peat-green text-[11px] font-bold text-white">
              {(from ? 1 : 0) + (to ? 1 : 0)}
            </span>
          ) : null}
        </button>

        {hasActiveFilter ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-peat-green/20 bg-peat-paper px-2.5 py-1.5 font-medium text-peat-forest">
              <CalendarDays
                aria-hidden="true"
                className="text-peat-green"
                size={14}
              />
              <span>
                {from ? `Dari ${from}` : "Awal waktu"} –{" "}
                {to ? `Sampai ${to}` : "Sekarang"}
              </span>
            </span>
            <Link
              className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-foreground transition hover:text-red-700"
              href={APP_ROUTES.audit.dashboard}
            >
              <X aria-hidden="true" size={14} />
              Hapus filter
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Menampilkan seluruh data tanpa batasan rentang tanggal.
          </p>
        )}
      </div>

      <DashboardDateFilterDialog isOpen={isOpen} onClose={handleClose}>
        <form
          action={APP_ROUTES.audit.dashboard}
          className="space-y-4"
          method="get"
        >
          <div className="space-y-1.5">
            <label
              className="block text-xs font-semibold text-peat-forest"
              htmlFor="dashboard-from"
            >
              Dari tanggal{" "}
              <span className="text-[11px] font-normal text-muted-foreground">
                (opsional)
              </span>
            </label>
            <input
              className="h-11 w-full rounded-xl border border-input bg-background px-3 font-mono text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              data-autofocus
              defaultValue={draftFrom}
              id="dashboard-from"
              max={draftTo || undefined}
              name="from"
              onChange={(e) => setDraftFrom(e.target.value)}
              placeholder="YYYY-MM-DD"
              type="date"
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="block text-xs font-semibold text-peat-forest"
              htmlFor="dashboard-to"
            >
              Sampai tanggal{" "}
              <span className="text-[11px] font-normal text-muted-foreground">
                (opsional)
              </span>
            </label>
            <input
              className="h-11 w-full rounded-xl border border-input bg-background px-3 font-mono text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              defaultValue={draftTo}
              id="dashboard-to"
              min={draftFrom || undefined}
              name="to"
              onChange={(e) => setDraftTo(e.target.value)}
              placeholder="YYYY-MM-DD"
              type="date"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-border pt-3">
            <button
              className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold text-peat-forest transition hover:bg-peat-paper"
              onClick={handleClose}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-peat-forest px-5 text-sm font-semibold text-white transition hover:bg-peat-green"
              type="submit"
            >
              <CalendarDays aria-hidden="true" size={16} />
              Terapkan tanggal
            </button>
          </div>
        </form>
      </DashboardDateFilterDialog>
    </div>
  );
}
