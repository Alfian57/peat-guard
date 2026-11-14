import { ShieldAlert } from "lucide-react";
import type { MrvLedgerRow } from "@/lib/server/mrv/contracts";
import {
  aiAnalysisStateLabel,
  reportCategoryLabel,
  reportUrgencyLabel,
} from "@/lib/report-labels";
import { formatDecimal } from "../audit-formatters";

export function LedgerAiTriage({ row }: { row: MrvLedgerRow }) {
  const category = row.aiTriage.category;
  const urgency = row.aiTriage.urgency;
  const confidence = row.aiTriage.confidence;

  return (
    <div className="min-w-36">
      <p className="font-semibold text-peat-forest">
        {reportCategoryLabel(category)}
      </p>
      {urgency ? (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldAlert aria-hidden="true" size={13} />
          {reportUrgencyLabel(urgency)}
          {confidence !== null ? ` · ${formatDecimal(confidence * 100)}%` : ""}
        </p>
      ) : null}
      <p className="mt-1 text-xs text-muted-foreground">
        Triase: {aiAnalysisStateLabel(row.aiTriage.state)}
      </p>
    </div>
  );
}
