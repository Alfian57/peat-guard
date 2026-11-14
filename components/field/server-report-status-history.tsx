"use client";

import { ChevronDown } from "lucide-react";
import type { ServerReportDetail } from "@/lib/client/offline/server-report-client";
import { handlingStatusLabel } from "@/lib/report-labels";

export function ServerReportStatusHistory({
  report,
}: {
  report: ServerReportDetail;
}) {
  if (report.statusEvents.length === 0) return null;

  return (
    <details className="group mt-4 border-t border-peat-forest/10">
      <summary className="flex min-h-11 list-none items-center justify-between gap-2 rounded-lg text-xs font-semibold text-peat-forest focus-visible:outline-2 focus-visible:outline-peat-green [&::-webkit-details-marker]:hidden">
        Riwayat penanganan ({report.statusEvents.length})
        <ChevronDown
          aria-hidden="true"
          className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          size={15}
        />
      </summary>
      <ol className="mt-3 space-y-3 border-l border-border pl-4">
        {report.statusEvents.map((event) => (
          <li key={event.id} className="relative text-sm">
            <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-peat-green" />
            <p className="font-semibold text-peat-forest">
              {event.previousStatus
                ? `${handlingStatusLabel(event.previousStatus)} → `
                : "Laporan dibuat · "}
              {handlingStatusLabel(event.nextStatus)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "long",
                timeStyle: "short",
                timeZone: "Asia/Jakarta",
              }).format(new Date(event.createdAt))}
            </p>
            {event.note ? (
              <p className="mt-1 leading-6 wrap-anywhere text-muted-foreground">
                {event.note}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </details>
  );
}
