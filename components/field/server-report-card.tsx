"use client";

import Image from "next/image";
import type { ServerReportSummary } from "@/lib/client/offline/server-report-client";
import { APP_ROUTES } from "@/lib/routes";
import {
  HANDLING_LABELS,
  URGENCY_LABELS,
  formatCapturedAt,
  reportSummaryTitle,
} from "./server-report-labels";

type ServerReportCardProps = {
  report: ServerReportSummary;
  localReportId?: string;
};

export function ServerReportCard({
  report,
  localReportId,
}: ServerReportCardProps) {
  const params = new URLSearchParams({ serverReportId: report.id });
  if (localReportId) params.set("reportId", localReportId);
  const href = `${APP_ROUTES.field.report}?${params.toString()}`;
  const title = reportSummaryTitle(report);

  return (
    <a
      href={href}
      className="flex min-h-[112px] items-center gap-3 rounded-2xl border border-border bg-white p-3 transition hover:border-peat-green/50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
    >
      <span className="relative size-[72px] shrink-0 overflow-hidden rounded-xl bg-secondary">
        {report.photoHref ? (
          <Image
            src={report.photoHref}
            alt={
              report.isDemoSample
                ? "Foto sampel demo laporan"
                : "Foto laporan patroli"
            }
            width={72}
            height={72}
            unoptimized
            className="size-full object-cover"
          />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold text-peat-forest">
            {title}
          </span>
          {report.aiUrgency ? (
            <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-semibold text-peat-forest">
              {URGENCY_LABELS[report.aiUrgency]}
            </span>
          ) : null}
          {report.isDemoSample ? (
            <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-900">
              Sampel demo
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">
          {formatCapturedAt(report.capturedAt)} ·{" "}
          {HANDLING_LABELS[report.handlingStatus]}
        </span>
        <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
          {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
        </span>
      </span>
    </a>
  );
}
