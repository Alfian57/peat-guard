"use client";

import { ReportCard } from "./report-card";
import { isRemovableLocalDraft } from "@/lib/client/offline/report-store";
import type { QueuedFieldReport } from "@/lib/client/offline/types";
import { APP_ROUTES } from "@/lib/routes";

export function FieldOutboxSection({
  isLoading,
  reports,
  onDelete,
}: {
  isLoading: boolean;
  reports: QueuedFieldReport[];
  onDelete: (reportId: string) => void;
}) {
  const outboxReports = reports.filter(
    (report) => report.syncState !== "synced",
  );

  return (
    <section className="mt-5" aria-labelledby="outbox-title">
      <h2
        id="outbox-title"
        className="font-heading text-2xl font-bold text-peat-forest"
      >
        Draf di perangkat
      </h2>
      {isLoading ? (
        <div
          className="mt-3 rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground"
          role="status"
        >
          Membuka antrean perangkat…
        </div>
      ) : outboxReports.length ? (
        <div className="mt-3 space-y-3">
          {outboxReports.map((report) => (
            <div key={report.clientReportId}>
              <ReportCard
                report={report}
                onDelete={
                  isRemovableLocalDraft(report)
                    ? () => onDelete(report.clientReportId)
                    : undefined
                }
              />
              {report.syncError ? (
                <p className="px-2 pt-2 text-xs text-destructive" role="status">
                  {report.syncError}
                </p>
              ) : null}
              {report.aiState === "skipped" ? (
                <p className="px-2 pt-1 text-xs text-muted-foreground">
                  Analisis AI dilewati sesuai pilihan relawan.
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <section className="mt-3 rounded-xl border border-dashed border-peat-green/40 bg-white p-4">
          <p className="text-sm text-muted-foreground">
            Tidak ada draf yang menunggu sinkronisasi.
          </p>
          <a
            href={APP_ROUTES.field.createReport}
            className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-peat-green px-4 text-sm font-semibold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-forest"
          >
            Buat laporan
          </a>
        </section>
      )}
    </section>
  );
}
