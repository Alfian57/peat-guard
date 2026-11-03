import {
  AIAnalysisState,
  HandlingStatus,
  ReportCategory,
  ReportUrgency,
  type AIAnalysisState as AIAnalysisStateValue,
  type HandlingStatus as HandlingStatusValue,
  type ReportCategory as ReportCategoryValue,
  type ReportUrgency as ReportUrgencyValue,
} from "@/app/generated/prisma/enums";

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

export function ReportCategoryLabel({
  category,
}: {
  category: ReportCategoryValue | null;
}) {
  if (!category)
    return <span className="text-peat-forest/60">Belum dinilai</span>;
  switch (category) {
    case ReportCategory.API_AKTIF:
      return "Api aktif";
    case ReportCategory.ASAP_GAMBUT:
      return "Asap gambut";
    case ReportCategory.SEKAT_KANAL_KERING:
      return "Sekat kanal kering";
    case ReportCategory.AMAN_TERKENDALI:
      return "Aman / terkendali";
  }
}

export function AiStateLabel({
  state,
}: {
  state: AIAnalysisStateValue | null;
}) {
  if (!state) return "Belum dianalisis";
  switch (state) {
    case AIAnalysisState.PENDING:
      return "Analisis menunggu";
    case AIAnalysisState.COMPLETED:
      return "Analisis selesai";
    case AIAnalysisState.FAILED:
      return "Analisis gagal";
    case AIAnalysisState.SKIPPED:
      return "Analisis dilewati";
  }
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
