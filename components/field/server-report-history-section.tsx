"use client";

import { RefreshCw } from "lucide-react";
import { ServerReportCard } from "./server-report-card";
import { ReportCard } from "./report-card";
import {
  findLocalReportForServer,
  splitReportHistory,
  type ServerReportSummary,
} from "@/lib/client/offline/server-report-client";
import type { QueuedFieldReport } from "@/lib/client/offline/types";

export type ServerHistoryStatus =
  "loading" | "loaded" | "error" | "unavailable";

export function ServerReportHistorySection({
  hasOwner,
  isConnected,
  localReports,
  onPageChange,
  onRefresh,
  page,
  pageSize,
  reports,
  status,
  total,
  error,
}: {
  hasOwner: boolean;
  isConnected: boolean;
  localReports: QueuedFieldReport[];
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  page: number;
  pageSize: number;
  reports: ServerReportSummary[];
  status: ServerHistoryStatus;
  total: number;
  error: string | null;
}) {
  const { localSentFallback } = splitReportHistory(reports, localReports);
  const localFallbackToShow = status === "loaded" ? [] : localSentFallback;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="mt-6" aria-labelledby="server-history-title">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="server-history-title"
          className="font-heading text-2xl font-bold text-peat-forest"
        >
          Tersimpan di posko
        </h2>
        {status !== "unavailable" ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={!isConnected || status === "loading"}
            aria-label="Muat ulang riwayat server"
            className="grid size-11 shrink-0 place-items-center rounded-lg text-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-60"
          >
            <RefreshCw
              aria-hidden="true"
              className={
                status === "loading"
                  ? "animate-spin motion-reduce:animate-none"
                  : ""
              }
              size={18}
            />
          </button>
        ) : null}
      </div>
      {hasOwner && !isConnected ? (
        <p
          className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950"
          role="status"
        >
          Riwayat server perlu koneksi. Salinan laporan terkirim dari perangkat
          ini tetap tersedia di bawah.
        </p>
      ) : null}
      {status === "loading" ? (
        <p
          className="mt-3 rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground"
          role="status"
        >
          Memuat riwayat server…
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
          role="alert"
        >
          {error} Salinan lokal tetap tersedia jika pernah disinkronkan di
          perangkat ini.
        </p>
      ) : null}
      {reports.length ? (
        <div className="mt-3 space-y-3">
          {reports.map((report) => (
            <ServerReportCard
              key={report.id}
              report={report}
              localReportId={
                findLocalReportForServer(report.id, localReports)
                  ?.clientReportId
              }
            />
          ))}
        </div>
      ) : status === "loaded" ? (
        <p className="mt-3 rounded-xl border border-dashed border-peat-green/40 bg-white p-4 text-sm text-muted-foreground">
          Belum ada laporan di riwayat server.
        </p>
      ) : null}
      {localFallbackToShow.length ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-peat-forest">
            Salinan terkirim di perangkat ini
          </h3>
          <div className="mt-2 space-y-3">
            {localFallbackToShow.map((report) => (
              <ReportCard key={report.clientReportId} report={report} />
            ))}
          </div>
        </div>
      ) : null}
      {status === "loaded" && pageCount > 1 ? (
        <nav
          className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-border bg-white p-2"
          aria-label="Halaman riwayat laporan"
        >
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="min-h-11 rounded-lg px-3 text-sm font-semibold text-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            Halaman {page} dari {pageCount} · {total} laporan
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            className="min-h-11 rounded-lg px-3 text-sm font-semibold text-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-50"
          >
            Berikutnya
          </button>
        </nav>
      ) : null}
    </section>
  );
}
