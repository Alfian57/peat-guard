import { ReportCard } from "@/components/command/reports/report-card";
import type { ReportListItem } from "@/components/command/reports/report-contracts";

export function ReportQueueRow({
  report,
  zones,
}: {
  report: ReportListItem;
  zones: ReadonlyMap<string, string>;
}) {
  return (
    <ReportCard
      report={report}
      zoneName={report.zoneId ? (zones.get(report.zoneId) ?? null) : null}
    />
  );
}

export { ReportQueueRow as ReportRow };
