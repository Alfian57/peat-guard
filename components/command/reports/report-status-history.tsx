import { ReportStatusBadge } from "@/components/command/reports/report-status-badge";
import type { ReportStatusEvent } from "@/components/command/reports/report-contracts";
import { formatDate } from "@/components/command/reports/report-card";

export function ReportStatusHistory({
  events,
}: {
  events: ReportStatusEvent[];
}) {
  return (
    <section
      aria-labelledby="report-history-heading"
      className="rounded-2xl border border-peat-forest/10 bg-white p-4"
    >
      <h2
        className="font-heading text-2xl font-bold text-peat-forest"
        id="report-history-heading"
      >
        Riwayat status
      </h2>
      {events.length === 0 ? (
        <p className="mt-3 text-sm text-peat-forest/65">
          Belum ada perubahan status.
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {events.map((event) => (
            <li
              className="relative border-l-2 border-peat-leaf pl-4"
              key={event.id}
            >
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
              <p className="mt-1 text-xs text-peat-forest/60">
                {formatDate(event.createdAt)}
              </p>
              {event.note ? (
                <p className="mt-2 text-sm leading-5 whitespace-pre-wrap text-peat-forest/75">
                  {event.note}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
