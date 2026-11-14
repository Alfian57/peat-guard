"use client";

import { ChevronDown } from "lucide-react";
import type { ServerReportDetail } from "@/lib/client/offline/server-report-client";
import { urgencyClasses } from "./field-report-presentation";
import { reportCategoryLabel, reportUrgencyLabel } from "@/lib/report-labels";

function aiStateMessage(report: ServerReportDetail): string {
  if (!report.aiConsent || report.aiState === "SKIPPED") {
    return "Analisis AI dilewati sesuai pilihan relawan.";
  }
  if (report.aiState === "PENDING")
    return "Analisis AI sedang menunggu proses.";
  if (report.aiState === "FAILED") {
    return "Analisis AI belum berhasil. Posko tetap dapat meninjau laporan ini.";
  }
  return "Analisis AI selesai.";
}

export function ServerReportAiAnalysis({
  report,
}: {
  report: ServerReportDetail;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-xs xl:flex-1">
      <h2 className="font-heading text-2xl font-bold text-peat-forest">
        Analisis AI
      </h2>
      <p className="mt-1 text-sm text-muted-foreground" role="status">
        {aiStateMessage(report)}
      </p>
      {report.aiState === "COMPLETED" ? (
        <>
          {report.aiCategory && report.aiUrgency ? (
            <p
              className={
                "mt-3 rounded-xl p-3 text-sm font-semibold " +
                urgencyClasses[report.aiUrgency]
              }
            >
              {reportCategoryLabel(report.aiCategory)} ·{" "}
              {reportUrgencyLabel(report.aiUrgency)}
              {report.aiConfidence !== null
                ? ` · Keyakinan ${Math.round(report.aiConfidence * 100)}%`
                : ""}
            </p>
          ) : null}
          {report.aiSummary ? (
            <p className="mt-3 text-sm leading-6 wrap-anywhere">
              {report.aiSummary}
            </p>
          ) : null}
          {report.aiActionRecommendations?.length ? (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-peat-forest">
                Tindakan yang disarankan
              </h3>
              <ol className="mt-2 space-y-2">
                {report.aiActionRecommendations.map((recommendation, index) => (
                  <li
                    key={`${index}-${recommendation}`}
                    className="flex gap-2 text-sm leading-6 wrap-anywhere"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-peat-green">
                      {index + 1}
                    </span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {report.aiVisualIndicators?.length || report.aiFalsePositiveCheck ? (
            <details className="group mt-4 border-t border-peat-forest/10">
              <summary className="flex min-h-11 list-none items-center justify-between gap-2 rounded-lg text-xs font-semibold text-peat-forest focus-visible:outline-2 focus-visible:outline-peat-green [&::-webkit-details-marker]:hidden">
                Rincian analisis
                <ChevronDown
                  aria-hidden="true"
                  className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  size={15}
                />
              </summary>
              {report.aiVisualIndicators?.length ? (
                <div className="mt-3">
                  <h3 className="text-sm font-semibold text-peat-forest">
                    Indikator visual
                  </h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {report.aiVisualIndicators.map((indicator) => (
                      <li key={indicator}>{indicator}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {report.aiFalsePositiveCheck ? (
                <p className="mt-3 rounded-xl border border-border p-3 text-sm leading-6 wrap-anywhere text-muted-foreground">
                  Pemeriksaan kemungkinan salah deteksi:{" "}
                  {report.aiFalsePositiveCheck}
                </p>
              ) : null}
            </details>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
