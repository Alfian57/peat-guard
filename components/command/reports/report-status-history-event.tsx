import { ReportStatusBadge } from "@/components/command/reports/report-status-badge";
import type { ReportStatusEvent } from "@/components/command/reports/report-contracts";
import { formatDate } from "@/components/command/reports/report-date";

export function ReportStatusHistoryEvent({
  event,
}: {
  event: ReportStatusEvent;
}) {
  return (
    <li className="border-l-2 border-peat-forest/15 pl-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {event.previousStatus ? (
            <>
              <ReportStatusBadge status={event.previousStatus} />
              <span aria-hidden="true" className="text-peat-forest/45">
                →
              </span>
            </>
          ) : null}
          <ReportStatusBadge status={event.nextStatus} />
        </div>
        <time
          className="text-xs text-muted-foreground"
          dateTime={event.createdAt}
        >
          {formatDate(event.createdAt)}
        </time>
      </div>
      {event.note ? (
        <p className="mt-2 text-sm leading-6 wrap-anywhere whitespace-pre-wrap text-peat-forest/75">
          {event.note}
        </p>
      ) : null}
    </li>
  );
}
