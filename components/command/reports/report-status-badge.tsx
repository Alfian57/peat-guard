import {
  HandlingStatus,
  ReportUrgency,
  type HandlingStatus as HandlingStatusValue,
  type ReportUrgency as ReportUrgencyValue,
} from "@/lib/generated/prisma/enums";

export { ReportUrgencyBadge } from "./report-urgency-badge";
export { ReportCategoryLabel } from "./report-category-label";
export { AiStateLabel } from "./report-ai-state-label";

export function ReportStatusBadge({ status }: { status: HandlingStatusValue }) {
  const label = statusLabel(status);
  const appearance =
    status === HandlingStatus.MENUNGGU_TINDAKAN
      ? "bg-peat-sun/25 text-amber-950"
      : status === HandlingStatus.DALAM_PENANGANAN
        ? "bg-blue-50 text-blue-900"
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

export function statusLabel(status: HandlingStatusValue): string {
  switch (status) {
    case HandlingStatus.MENUNGGU_TINDAKAN:
      return "Menunggu tindakan";
    case HandlingStatus.DALAM_PENANGANAN:
      return "Dalam penanganan";
    case HandlingStatus.SELESAI:
      return "Selesai";
  }
}

export function urgencyLabel(urgency: ReportUrgencyValue): string {
  switch (urgency) {
    case ReportUrgency.KRITIS:
      return "Kritis";
    case ReportUrgency.WASPADA:
      return "Waspada";
    case ReportUrgency.RENDAH:
      return "Rendah";
  }
}
