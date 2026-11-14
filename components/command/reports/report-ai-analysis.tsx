import { ChevronDown } from "lucide-react";

import {
  AiStateLabel,
  ReportCategoryLabel,
  ReportUrgencyBadge,
} from "@/components/command/reports/report-status-badge";
import type { ReportDetail } from "@/components/command/reports/report-contracts";
import { formatDate } from "@/components/command/reports/report-date";
import { ReportTextList } from "@/components/command/reports/report-text-list";

export function ReportAiAnalysis({ report }: { report: ReportDetail }) {
  return (
    <section
      aria-labelledby="report-ai-heading"
      className="min-w-0 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            className="font-heading text-2xl font-bold text-peat-forest"
            id="report-ai-heading"
          >
            Analisis visual AI
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            <AiStateLabel state={report.aiState} />
            {report.aiAnalyzedAt
              ? " · dianalisis " + formatDate(report.aiAnalyzedAt)
              : ""}
          </p>
        </div>
        {report.aiConfidence === null ? null : (
          <p className="text-xs font-medium text-muted-foreground">
            Keyakinan {Math.round(report.aiConfidence * 100)}%
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-peat-forest">
          <ReportCategoryLabel category={report.aiCategory} />
        </span>
        <ReportUrgencyBadge urgency={report.aiUrgency} />
      </div>

      {report.aiSummary ? (
        <p className="mt-4 text-sm leading-6 wrap-anywhere text-peat-forest/80">
          {report.aiSummary}
        </p>
      ) : null}
      {report.aiActionRecommendations?.length ? (
        <ReportTextList
          heading="Saran tindak lanjut"
          values={report.aiActionRecommendations}
        />
      ) : null}
      {report.aiVisualIndicators?.length || report.aiFalsePositiveCheck ? (
        <details className="group mt-5 border-t border-peat-forest/10">
          <summary className="flex min-h-11 list-none items-center justify-between gap-3 rounded-lg text-xs font-semibold text-peat-forest/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green [&::-webkit-details-marker]:hidden">
            Rincian analisis
            <ChevronDown
              aria-hidden="true"
              className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
              size={16}
            />
          </summary>
          {report.aiVisualIndicators?.length ? (
            <ReportTextList
              heading="Indikator visual"
              values={report.aiVisualIndicators}
            />
          ) : null}
          {report.aiFalsePositiveCheck ? (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-peat-forest">
                Pemeriksaan kemungkinan positif palsu
              </h3>
              <p className="mt-2 text-sm leading-6 wrap-anywhere text-peat-forest/75">
                {report.aiFalsePositiveCheck}
              </p>
            </div>
          ) : null}
        </details>
      ) : null}
      {report.aiConsent ? null : (
        <p className="mt-4 rounded-xl bg-peat-paper p-3 text-xs leading-5 text-muted-foreground">
          Analisis visual dilewati karena tidak ada persetujuan AI pada saat
          laporan dibuat.
        </p>
      )}
    </section>
  );
}
