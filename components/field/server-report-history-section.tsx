"use client";

import {
  ClipboardCheck,
  ShieldCheck,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import { FieldFeedback } from "./field-feedback";
import { ServerReportCard } from "./server-report-card";
import { ReportCard } from "./report-card";
import { FieldReportListSkeleton } from "./field-report-list-skeleton";
import { fieldQueueReportGrid } from "./field-report-layout";
import {
  findLocalReportForServer,
  splitReportHistory,
  type ServerReportSummary,
} from "@/lib/client/offline/server-report-client";
import type { QueuedFieldReport } from "@/lib/client/offline/types";

export type ServerHistoryStatus =
  "loading" | "loaded" | "error" | "unavailable";

export function ServerReportHistorySection({
  isConnected,
  localReports,
  onPageChange,
  page,
  pageSize,
  reports,
  status,
  total,
  error,
}: {
  isConnected: boolean;
  localReports: QueuedFieldReport[];
  onPageChange: (page: number) => void;
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
  const isLoading = status === "loading" && reports.length === 0;

  return (
    <section className="min-w-0" aria-labelledby="server-history-title">
      <h2
        id="server-history-title"
        className="font-heading text-2xl font-bold text-peat-forest"
      >
        Tersimpan di posko
      </h2>
      {status === "unavailable" ? (
        <FieldFeedback
          icon={isConnected ? ShieldCheck : WifiOff}
          title={
            isConnected
              ? "Riwayat posko belum tersedia"
              : "Riwayat perlu koneksi"
          }
          className="mt-2"
          role="status"
        >
          {isConnected
            ? "Masuk dengan akun relawan untuk membuka riwayat dari posko."
            : "Hubungkan perangkat untuk memuat riwayat dari posko."}
        </FieldFeedback>
      ) : null}
      {isLoading ? (
        <FieldReportListSkeleton
          className={fieldQueueReportGrid}
          count={3}
          label="Memuat riwayat posko"
        />
      ) : null}
      {status === "error" ? (
        <FieldFeedback
          icon={TriangleAlert}
          title="Riwayat belum dapat dimuat"
          className="mt-2"
          role="alert"
        >
          {error ?? "Gunakan Muat ulang untuk mencoba kembali."}
        </FieldFeedback>
      ) : null}
      {reports.length ? (
        <div className={fieldQueueReportGrid}>
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
        <FieldFeedback
          icon={ClipboardCheck}
          title="Belum ada laporan terkirim"
          className="mt-2"
          variant="empty"
        >
          Laporan akan muncul di sini setelah diterima posko.
        </FieldFeedback>
      ) : null}
      {localFallbackToShow.length ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-peat-forest">
            Salinan terkirim di perangkat ini
          </h3>
          <div className={fieldQueueReportGrid}>
            {localFallbackToShow.map((report) => (
              <ReportCard key={report.clientReportId} report={report} />
            ))}
          </div>
        </div>
      ) : null}
      {status === "loaded" && pageCount > 1 ? (
        <nav
          className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-peat-forest/10 bg-white px-2"
          aria-label="Halaman riwayat laporan"
        >
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="min-h-10 rounded-lg px-2 text-xs font-semibold text-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-50"
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
            className="min-h-10 rounded-lg px-2 text-xs font-semibold text-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-50"
          >
            Berikutnya
          </button>
        </nav>
      ) : null}
    </section>
  );
}
