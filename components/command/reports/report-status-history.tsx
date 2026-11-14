import { ChevronDown } from "lucide-react";

import type { ReportStatusEvent } from "@/components/command/reports/report-contracts";
import { ReportStatusHistoryEvent } from "@/components/command/reports/report-status-history-event";
import { cn } from "@/lib/utils";

export function ReportStatusHistory({
  className,
  events,
}: {
  className?: string;
  events: ReportStatusEvent[];
}) {
  // The detail endpoint returns history in chronological order.
  const latestEvent = events.at(-1);
  const earlierEvents = events.slice(0, -1).toReversed();

  return (
    <section
      aria-labelledby="report-history-heading"
      className={cn(
        "rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs sm:p-6",
        className,
      )}
    >
      <h2
        className="font-heading text-2xl font-bold text-peat-forest"
        id="report-history-heading"
      >
        Riwayat status
      </h2>
      {latestEvent ? (
        <>
          <ol aria-label="Perubahan status terbaru" className="mt-4">
            <ReportStatusHistoryEvent event={latestEvent} />
          </ol>
          {earlierEvents.length > 0 ? (
            <details className="group mt-4 border-t border-peat-forest/10">
              <summary className="flex min-h-11 list-none items-center justify-between gap-3 rounded-lg text-xs font-semibold text-peat-forest/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green [&::-webkit-details-marker]:hidden">
                Lihat riwayat sebelumnya ({earlierEvents.length})
                <ChevronDown
                  aria-hidden="true"
                  className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  size={16}
                />
              </summary>
              <ol
                aria-label="Perubahan status sebelumnya"
                className="mt-3 space-y-4"
              >
                {earlierEvents.map((event) => (
                  <ReportStatusHistoryEvent event={event} key={event.id} />
                ))}
              </ol>
            </details>
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Belum ada perubahan status.
        </p>
      )}
    </section>
  );
}
