import { ShieldCheck } from "lucide-react";

import {
  AiStateLabel,
  ReportCategoryLabel,
  ReportUrgencyBadge,
} from "@/components/command/reports/report-status-badge";
import type { ReportDetail } from "@/components/command/reports/report-contracts";
import { formatDate } from "@/components/command/reports/report-card";
import { ReportTextList } from "@/components/command/reports/report-text-list";

export function ReportAiAnalysis({ report }: { report: ReportDetail }) {
  return (
    <section
      aria-labelledby="report-ai-heading"
      className="rounded-2xl border border-peat-forest/10 bg-white p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            className="font-heading text-2xl font-bold text-peat-forest"
            id="report-ai-heading"
          >
            Analisis visual AI
          </h2>
          <p className="mt-1 text-xs text-peat-forest/65">
            <AiStateLabel state={report.aiState} />
            {report.aiAnalyzedAt
              ? " · dianalisis " + formatDate(report.aiAnalyzedAt)
              : ""}
          </p>
        </div>
        {report.aiConfidence === null ? null : (
          <p className="text-sm font-semibold text-peat-green">
            Keyakinan {Math.round(report.aiConfidence * 100)}%
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-peat-paper px-3 py-2 text-sm font-semibold text-peat-forest">
          <ReportCategoryLabel category={report.aiCategory} />
        </span>
        <ReportUrgencyBadge urgency={report.aiUrgency} />
      </div>

      {report.aiSummary ? (
        <p className="mt-4 text-sm leading-6 text-peat-forest/80">
          {report.aiSummary}
        </p>
      ) : null}
      {report.aiVisualIndicators?.length ? (
        <ReportTextList
          heading="Indikator visual"
          values={report.aiVisualIndicators}
        />
      ) : null}
      {report.aiFalsePositiveCheck ? (
        <div className="mt-4 rounded-xl border border-blue-900/10 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-950">
            <ShieldCheck aria-hidden="true" size={16} />
            Pemeriksaan kemungkinan positif palsu
          </div>
          <p className="mt-2 text-sm leading-6 text-blue-950/80">
            {report.aiFalsePositiveCheck}
          </p>
        </div>
      ) : null}
      {report.aiActionRecommendations?.length ? (
        <ReportTextList
          heading="Saran tindak lanjut"
          values={report.aiActionRecommendations}
        />
      ) : null}
      {report.aiConsent ? null : (
        <p className="mt-4 rounded-xl bg-peat-paper p-3 text-xs leading-5 text-peat-forest/70">
          Analisis visual dilewati karena tidak ada persetujuan AI pada saat
          laporan dibuat.
        </p>
      )}
    </section>
  );
}
