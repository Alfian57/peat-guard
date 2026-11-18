import { API_ROUTES } from "@/lib/routes";
import type { MrvLedgerAuditEntry } from "@/lib/server/mrv/contracts";
import {
  aiAnalysisStateLabel,
  reportCategoryLabel,
  reportUrgencyLabel,
} from "@/lib/report-labels";
import { mrvAuditEventLabel } from "@/lib/mrv/audit-event-label";

import { formatDateTime, formatDecimal } from "../audit-formatters";
import { EvidenceSnapshotDetails } from "./evidence-snapshot-details";

function eventTitle(event: MrvLedgerAuditEntry): string {
  if (event.eventType !== "MRV_EVIDENCE_REVIEWED") {
    return mrvAuditEventLabel(event.eventType);
  }

  const decisionLabels = {
    ACCEPTED: "bukti diterima",
    NEEDS_FOLLOW_UP: "perlu tindak lanjut",
    REJECTED: "bukti tidak diterima",
  };
  return `Keputusan peninjauan: ${event.decision ? decisionLabels[event.decision] : "tidak tersedia"}`;
}

export function LedgerAuditTimeline({
  history,
  reportId,
}: {
  reportId?: string;
  history: MrvLedgerAuditEntry[];
}) {
  return (
    <ol className="mt-5 space-y-4 border-l border-peat-green/20 pl-4 text-sm">
      {history.length > 0 ? (
        history.map((event) => (
          <li key={event.eventId}>
            <p className="font-semibold text-peat-forest">
              {eventTitle(event)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              <time dateTime={event.createdAt}>
                {formatDateTime(event.createdAt)}
              </time>
              {event.actorRole ? ` · ${event.actorRole}` : ""}
            </p>
            {event.classification ? (
              <p className="mt-2 text-peat-forest">
                {aiAnalysisStateLabel(event.classification.state)}
                {` · ${reportCategoryLabel(event.classification.category)}`}
                {` · ${reportUrgencyLabel(event.classification.urgency)}`}
                {event.classification.confidence !== null
                  ? ` · ${formatDecimal(event.classification.confidence * 100)}%`
                  : ""}
              </p>
            ) : null}
            {event.note ? (
              <p className="mt-2 whitespace-pre-wrap">{event.note}</p>
            ) : null}
            {reportId && event.hasSupplementPhoto ? (
              <a
                className="mt-2 inline-block text-peat-green underline"
                href={API_ROUTES.reports.supplementPhoto(
                  reportId,
                  event.eventId,
                )}
              >
                Lihat foto bukti tambahan
              </a>
            ) : null}
            <EvidenceSnapshotDetails event={event} />
          </li>
        ))
      ) : (
        <li className="text-muted-foreground">
          Snapshot audit awal belum tersedia untuk laporan ini.
        </li>
      )}
    </ol>
  );
}
