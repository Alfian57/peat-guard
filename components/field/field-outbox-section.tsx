"use client";

import { ClipboardList } from "lucide-react";
import { FieldFeedback } from "./field-feedback";
import { ReportCard } from "./report-card";
import { isRemovableLocalDraft } from "@/lib/client/offline/report-store";
import type { QueuedFieldReport } from "@/lib/client/offline/types";
import { APP_ROUTES } from "@/lib/routes";
import { FieldReportListSkeleton } from "./field-report-list-skeleton";
import { fieldQueueReportGrid } from "./field-report-layout";

export function FieldOutboxSection({
  isLoading,
  drafts,
  onDelete,
}: {
  isLoading: boolean;
  drafts: QueuedFieldReport[];
  onDelete: (reportId: string) => void;
}) {
  return (
    <section className="min-w-0" aria-labelledby="outbox-title">
      <h2
        id="outbox-title"
        className="font-heading text-2xl font-bold text-peat-forest"
      >
        Draf di perangkat
      </h2>
      {isLoading ? (
        <FieldReportListSkeleton
          className={fieldQueueReportGrid}
          count={1}
          label="Memuat draf dari perangkat"
          draft
        />
      ) : drafts.length ? (
        <div className={fieldQueueReportGrid}>
          {drafts.map((report) => (
            <div key={report.clientReportId} className="flex min-w-0 flex-col">
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
        <FieldFeedback
          icon={ClipboardList}
          title="Belum ada draf"
          className="mt-2"
          variant="empty"
          action={
            <a
              href={APP_ROUTES.field.createReport}
              className="inline-flex min-h-10 items-center rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-forest"
            >
              Buat laporan
            </a>
          }
        >
          Laporan baru muncul di sini sampai terkirim ke posko.
        </FieldFeedback>
      )}
    </section>
  );
}
