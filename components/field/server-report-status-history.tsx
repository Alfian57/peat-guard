"use client";

import type { ServerReportDetail } from "@/lib/client/offline/server-report-client";
import { HANDLING_LABELS } from "./server-report-labels";

export function ServerReportStatusHistory({
  report,
}: {
  report: ServerReportDetail;
}) {
  if (report.statusEvents.length === 0) return null;

  return (
    <ol className="mt-3 space-y-3 border-l border-border pl-4">
      {report.statusEvents.map((event) => (
        <li key={event.id} className="relative text-sm">
          <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-peat-green" />
          <p className="font-semibold text-peat-forest">
            {event.previousStatus
              ? `${HANDLING_LABELS[event.previousStatus]} → `
              : "Laporan dibuat · "}
            {HANDLING_LABELS[event.nextStatus]}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("id-ID", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "Asia/Jakarta",
            }).format(new Date(event.createdAt))}
          </p>
          {event.note ? (
            <p className="mt-1 leading-5 text-muted-foreground">{event.note}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
