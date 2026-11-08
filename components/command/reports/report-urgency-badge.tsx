import {
  ReportUrgency,
  type ReportUrgency as ReportUrgencyValue,
} from "@/lib/generated/prisma/enums";

import { urgencyLabel } from "./report-status-badge";

export function ReportUrgencyBadge({
  urgency,
}: {
  urgency: ReportUrgencyValue | null;
}) {
  if (!urgency) {
    return <span className="text-xs text-peat-forest/60">Belum dinilai</span>;
  }
  const label = urgencyLabel(urgency);
  const appearance =
    urgency === ReportUrgency.KRITIS
      ? "bg-red-50 text-red-900"
      : urgency === ReportUrgency.WASPADA
        ? "bg-amber-50 text-amber-950"
        : "bg-safe/10 text-safe";
  return (
    <span
      className={
        "inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold " +
        appearance
      }
    >
      {label}
    </span>
  );
}
