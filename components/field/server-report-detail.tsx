"use client";

import { ArrowLeft, RefreshCw } from "lucide-react";
import { useState } from "react";
import { EvidenceFollowUp } from "./evidence-follow-up";
import { CANAL_CONDITION_LABELS } from "@/lib/canal-observation";
import type { ServerReportDetail as ServerReportDetailDto } from "@/lib/client/offline/server-report-client";
import { handlingStatusLabel, reportCategoryLabel } from "@/lib/report-labels";
import { ServerReportAiAnalysis } from "./server-report-ai-analysis";
import { ServerReportStatusHistory } from "./server-report-status-history";
import { handlingClasses } from "./field-report-presentation";
import { FieldReportEvidence } from "./field-report-evidence";
import { FieldReportLocationDetails } from "./field-report-location-details";
import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
import { APP_ROUTES } from "@/lib/routes";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function ServerReportDetail({
  report,
  onRefresh,
  isRefreshing = false,
}: {
  report: ServerReportDetailDto;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const title = report.tags[0]
    ? report.tags[0]
    : report.aiCategory
      ? reportCategoryLabel(report.aiCategory)
      : "Temuan lapangan";

  return (
    <article className="w-full min-w-0">
      <a
        href={APP_ROUTES.field.queue}
        className="mb-2 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-peat-forest hover:underline focus-visible:outline-2 focus-visible:outline-peat-green"
      >
        <ArrowLeft aria-hidden="true" size={17} /> Kembali ke antrean
      </a>
      <WorkspacePageHeading
        compact
        className="mb-4 gap-2"
        title={title}
        action={
          report.isDemoSample ? (
            <span className="rounded-full bg-peat-sun/20 px-3 py-1 text-xs font-semibold text-peat-forest">
              Sampel demo
            </span>
          ) : undefined
        }
      />
      <div className="grid items-stretch gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <FieldReportEvidence
          photoHref={report.hasPhoto && !photoFailed ? report.photoHref : null}
          photoMessage={
            report.hasPhoto
              ? "Foto privat tidak dapat dimuat."
              : "Laporan ini tidak menyertakan foto."
          }
          isDemoSample={report.isDemoSample}
          fieldNotes={report.fieldNotes}
          tags={report.tags}
          onPhotoError={() => setPhotoFailed(true)}
        />
        <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
          {report.followUp ? (
            <EvidenceFollowUp
              key={report.followUp.reviewId}
              reportId={report.id}
              request={report.followUp}
              onSent={onRefresh}
            />
          ) : null}
          {report.canalCondition ? (
            <section className="rounded-xl border border-border bg-white p-4">
              <h2 className="font-heading text-xl font-bold">
                Observasi sekat kanal
              </h2>
              <p>{CANAL_CONDITION_LABELS[report.canalCondition]}</p>
              {report.canalObservation ? (
                <p className="text-sm whitespace-pre-wrap">
                  {report.canalObservation}
                </p>
              ) : null}
            </section>
          ) : null}
          <section
            className="rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-xs"
            aria-labelledby="server-status-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="server-status-title"
                  className="font-heading text-2xl font-bold text-peat-forest"
                >
                  Status laporan
                </h2>
                <p
                  className={
                    "mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold " +
                    handlingClasses[report.handlingStatus]
                  }
                  role="status"
                >
                  {handlingStatusLabel(report.handlingStatus)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Diterima posko {formatDate(report.syncedAt)}
                </p>
              </div>
              {onRefresh ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  aria-label="Muat ulang status laporan"
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-60"
                >
                  <RefreshCw
                    aria-hidden="true"
                    className={
                      isRefreshing
                        ? "animate-spin motion-reduce:animate-none"
                        : ""
                    }
                    size={18}
                  />
                </button>
              ) : null}
            </div>
            <ServerReportStatusHistory report={report} />
          </section>

          <FieldReportLocationDetails
            latitude={report.latitude}
            longitude={report.longitude}
            accuracyMeters={report.accuracyMeters}
            capturedAt={report.capturedAt}
            nearestWaterDistanceM={report.nearestWaterDistanceM}
          />

          <ServerReportAiAnalysis report={report} />
        </div>
      </div>

      <p className="mt-4 mb-2 text-center font-mono text-[10px] wrap-anywhere text-muted-foreground">
        ID laporan: {report.id}
      </p>
    </article>
  );
}
